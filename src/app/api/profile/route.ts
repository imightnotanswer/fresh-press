import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseServer as supabase } from "@/lib/supabase-server";
import { sanity } from "@/lib/sanity";
import { groq } from "next-sanity";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!supabase) {
            return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId") || session.user.id;

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile:", profileError);
            return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
        }

        // Get user's liked posts with minimal post info for linking
        const { data: likes, error: likesError } = await supabase
            .from("likes")
            .select("post_id, post_type, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        // Enrich likes with minimal post data from Sanity so cards look like media/review pages
        let likedItems = likes || [];
        if (sanity && likedItems.length > 0) {
            const reviewIds = likedItems.filter(l => l.post_type === "review").map(l => l.post_id);
            const mediaIds = likedItems.filter(l => l.post_type === "media").map(l => l.post_id);

            const [reviewDocs, mediaDocs] = await Promise.all([
                reviewIds.length ? sanity.fetch(groq`*[_type=="review" && _id in ${reviewIds}] { _id, _type, title, slug, publishedAt, artist->{name}, "coverUrl": cover.asset->url }`) : Promise.resolve([]),
                mediaIds.length ? sanity.fetch(groq`*[_type=="media" && _id in ${mediaIds}] { _id, _type, title, slug, publishedAt, artist->{name}, "coverUrl": cover.asset->url, videoUrl }`) : Promise.resolve([]),
            ]);

            const byId: Record<string, any> = {};
            [...reviewDocs, ...mediaDocs].forEach((d: any) => { byId[d._id] = d; });

            likedItems = likedItems.map(l => ({
                ...l,
                post: byId[l.post_id] || null,
            }));
        }

        if (likesError) {
            console.error("Error fetching likes:", likesError);
            return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 });
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
            likes: likedItems
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

        const { username, display_name, bio, is_public } = await request.json();

        const { data, error } = await supabase
            .from("user_profiles")
            .upsert({
                id: session.user.id,
                username,
                display_name,
                bio,
                is_public: is_public ?? true,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error("Error updating profile:", error);
            return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in profile PUT API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
