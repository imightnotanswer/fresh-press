import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseServer as supabase } from "@/lib/supabase-server";
import { sanity } from "@/lib/sanity";
import { groq } from "next-sanity";

// Type definitions
interface UserProfile {
    id: string;
    username: string;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    avatar_color: string | null;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

interface LikedPost {
    post_id: string;
    post_type: string;
    created_at: string;
    post?: {
        _id: string;
        _type: string;
        title?: string;
        slug?: { current?: string };
        artist?: { name?: string } | null;
        coverUrl?: string | null;
        publishedAt?: string;
        videoUrl?: string;
    } | null;
}

interface Comment {
    id: string;
    user_id: string;
    post_type: string;
    post_id: string;
    body: string;
    created_at: string;
    score?: number;
    up_count?: number;
    down_count?: number;
    target_title?: string;
    link?: string;
}

interface SanityDocument {
    _id: string;
    _type: string;
    title?: string;
    slug?: { current?: string };
    artist?: { name?: string } | null;
    coverUrl?: string | null;
    publishedAt?: string;
    videoUrl?: string;
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Supabase may be unavailable in some environments; we still return a fallback profile

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId") || session.user.id;

        // Get user profile
        let profile: UserProfile | null = null;
        let profileError: Error | null = null;
        if (supabase) {
            const { data, error } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("id", userId)
                .single();
            profile = data;
            profileError = error;
        }

        if (profileError && (profileError as any).code !== 'PGRST116') {
            console.error("Error fetching profile:", profileError);
            return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
        }

        // If no profile row exists, create one automatically based on session
        if (!profile && supabase) {
            const defaultProfile = {
                id: userId,
                username: session.user.email?.split('@')[0] || 'user',
                display_name: session.user.name || session.user.email?.split('@')[0] || 'User',
                bio: null as string | null,
                avatar_url: session.user.image as string | null,
                is_public: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            const { data: created, error: upsertError } = await supabase
                .from('user_profiles')
                .upsert(defaultProfile, { onConflict: 'id' })
                .select('*')
                .single();
            if (upsertError) {
                console.warn('Profile auto-create failed, continuing with fallback:', upsertError);
            } else {
                profile = created;
            }
        }

        // Get user's liked posts with minimal post info for linking and counts
        let likes: LikedPost[] | null = null;
        let likesError: Error | null = null;
        if (supabase) {
            const { data, error } = await supabase
                .from("likes")
                .select("post_id, post_type, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });
            likes = data;
            likesError = error;
        }

        // Enrich likes with minimal post data from Sanity so cards look like media/review pages
        let likedItems: LikedPost[] = likes || [];
        if (sanity && likedItems.length > 0) {
            const reviewIds = likedItems.filter(l => l.post_type === "review").map(l => l.post_id);
            const mediaIds = likedItems.filter(l => l.post_type === "media").map(l => l.post_id);

            const [reviewDocs, mediaDocs] = await Promise.all([
                reviewIds.length
                    ? sanity.fetch(
                        groq`*[_type=="review" && _id in $ids] { _id, _type, title, slug, publishedAt, artist->{name}, "coverUrl": cover.asset->url }`,
                        { ids: reviewIds }
                    )
                    : Promise.resolve([]),
                mediaIds.length
                    ? sanity.fetch(
                        groq`*[_type=="media" && _id in $ids] { _id, _type, title, slug, publishedAt, artist->{name}, "coverUrl": cover.asset->url, videoUrl }`,
                        { ids: mediaIds }
                    )
                    : Promise.resolve([]),
            ]);

            const byId: Record<string, SanityDocument> = {};
            [...reviewDocs, ...mediaDocs].forEach((d: SanityDocument) => { byId[d._id] = d; });

            // fetch counts for all liked posts in one go
            const countsByKey: Record<string, number> = {};
            if (supabase && likedItems.length) {
                const { data: likeRows } = await supabase
                    .from('likes')
                    .select('post_id, post_type');
                (likeRows || []).forEach((r: { post_id: string; post_type: string }) => {
                    const k = `${r.post_type}:${r.post_id}`;
                    countsByKey[k] = (countsByKey[k] || 0) + 1;
                });
            }

            likedItems = likedItems.map(l => ({
                ...l,
                post: byId[l.post_id] || null,
                like_count: countsByKey[`${l.post_type}:${l.post_id}`] || 0,
            }));
        }

        if (likesError) {
            console.warn("Error fetching likes; returning empty list:", likesError);
            likedItems = [];
        }

        return NextResponse.json({
            profile: profile || {
                id: userId,
                username: session.user.email?.split('@')[0] || 'user',
                display_name: session.user.name || session.user.email?.split('@')[0] || 'User',
                bio: null,
                avatar_url: session.user.image,
                is_public: true,
            },
            likes: likedItems,
            comments: await (async () => {
                if (!supabase) return [];
                const { data, error } = await supabase
                    .from('comments')
                    .select('id, post_id, post_type, created_at, body')
                    .eq('user_id', userId)
                    .eq('deleted', false)
                    .order('created_at', { ascending: false })
                    .limit(50);
                if (error || !data) return [];

                // Fetch comment scores
                const commentIds = data.map((c: any) => c.id);
                const commentScores: Record<string, { score: number, up_count: number, down_count: number }> = {};
                if (commentIds.length && supabase) {
                    const { data: scoreRows } = await supabase
                        .from('comment_scores')
                        .select('comment_id, score, up_count, down_count')
                        .in('comment_id', commentIds);
                    (scoreRows || []).forEach((s: { comment_id: string; score: number; up_count: number; down_count: number }) => {
                        commentScores[s.comment_id] = {
                            score: s.score || 0,
                            up_count: s.up_count || 0,
                            down_count: s.down_count || 0
                        };
                    });
                }

                // Enrich with link paths using Sanity slugs
                try {
                    if (sanity && data.length) {
                        const reviewIds = data.filter((c: any) => c.post_type === 'review').map((c: any) => c.post_id);
                        const mediaIds = data.filter((c: any) => c.post_type === 'media').map((c: any) => c.post_id);
                        const [reviewDocs, mediaDocs] = await Promise.all([
                            reviewIds.length
                                ? sanity.fetch(
                                    groq`*[_type=="review" && _id in $ids]{ _id, slug, title, artist->{name} }`,
                                    { ids: reviewIds }
                                )
                                : Promise.resolve([]),
                            mediaIds.length
                                ? sanity.fetch(
                                    groq`*[_type=="media" && _id in $ids]{ _id, slug, title }`,
                                    { ids: mediaIds }
                                )
                                : Promise.resolve([]),
                        ]);
                        const pathById: Record<string, string> = {};
                        const titleById: Record<string, string> = {};
                        (reviewDocs as SanityDocument[]).forEach((d: SanityDocument) => {
                            if (d?.slug?.current) pathById[d._id] = `/reviews/${d.slug.current}`;
                            const album = d?.title || "Review";
                            const artist = d?.artist?.name ? ` by ${d.artist.name}` : "";
                            titleById[d._id] = `${album}${artist}`;
                        });
                        (mediaDocs as SanityDocument[]).forEach((d: SanityDocument) => {
                            if (d?.slug?.current) pathById[d._id] = `/media/${d.slug.current}`;
                            titleById[d._id] = d?.title || "Media";
                        });
                        return data.map((c: any) => ({
                            ...c,
                            link: pathById[c.post_id] ? `${pathById[c.post_id]}#comment-${c.id}` : null,
                            target_title: titleById[c.post_id] || null,
                            score: commentScores[c.id]?.score || 0,
                            up_count: commentScores[c.id]?.up_count || 0,
                            down_count: commentScores[c.id]?.down_count || 0,
                        }));
                    }
                } catch { }
                return data.map((c: any) => ({
                    ...c,
                    score: commentScores[c.id]?.score || 0,
                    up_count: commentScores[c.id]?.up_count || 0,
                    down_count: commentScores[c.id]?.down_count || 0,
                }));
            })()
        });
    } catch (error) {
        console.error("Error in profile GET API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!supabase) {
            return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        }

        // Parse the body ONCE (request.json() is a stream and can only be read once)
        const body = await request.json();
        const { username, display_name, bio, is_public, avatar_color } = body || {};

        const { data, error } = await supabase
            .from("user_profiles")
            .upsert({
                id: session.user.id,
                username,
                display_name,
                bio,
                avatar_color: avatar_color ?? null,
                is_public: is_public ?? true,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            if ((error as any).code === '23505') {
                return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
            }
            console.error("Error updating profile:", error);
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in profile PUT API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
