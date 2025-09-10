"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Settings, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import MediaCard from "@/components/MediaCard";
import ReviewCard from "@/components/ReviewCard";
import Link from "next/link";

// Type definitions
interface LikeData {
    post_id: string;
}

interface CountData {
    post_id: string;
    like_count: number;
}

interface Comment {
    id: string;
    body: string;
    created_at: string;
    post_type: string;
    post_id: string;
    target_title?: string;
    up_count?: number;
    down_count?: number;
    score?: number;
    link?: string;
}

interface Media {
    _id: string;
    title: string;
    slug: { current: string };
    artist: { name: string; slug: { current: string } };
    coverUrl?: string;
    publishedAt: string;
    videoUrl?: string;
    __seed?: { count: number; liked: boolean };
}

interface Review {
    _id: string;
    title: string;
    slug: { current: string };
    artist: { name: string; slug: { current: string } };
    coverUrl?: string;
    publishedAt: string;
    blurb?: string;
    __seed?: { count: number; liked: boolean };
}

interface UserProfile {
    id: string;
    username: string;
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    avatar_color?: string | null;
    is_public: boolean;
}

interface LikedPost {
    post_id: string;
    post_type: "media" | "review" | string;
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

function ProfilePageInner() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const requestedUserId = searchParams.get("userId");
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    const deleteComment = async (commentId: string) => {
        try {
            const response = await fetch(`/api/comments?id=${commentId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                // Remove comment from local state
                setComments(prev => prev.filter(c => c.id !== commentId));
            } else {
                console.error('Failed to delete comment');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            redirect("/api/auth/signin");
            return;
        }
        if (status === "authenticated") {
            // Reset while switching between different user profiles to avoid stale content
            setLoading(true);
            setProfile(null);
            fetchProfile();
        }
    }, [status, requestedUserId]);

    const fetchProfile = async () => {
        try {
            const query = requestedUserId ? `?userId=${encodeURIComponent(requestedUserId)}` : "";
            const response = await fetch(`/api/profile${query}`);
            if (response.ok) {
                const data = await response.json();
                setProfile(data.profile);

                // Attach like seeds (count + likedByMe) to each liked post so cards render correctly
                let likes: LikedPost[] = data.likes || [];
                try {
                    const reviews = likes.filter(l => l.post && l.post_type === 'review');
                    const media = likes.filter(l => l.post && l.post_type === 'media');
                    const reviewIds = reviews.map(l => l.post!._id);
                    const mediaIds = media.map(l => l.post!._id);

                    const [reviewRes, mediaRes] = await Promise.all([
                        reviewIds.length ? fetch(`/api/likes/batch?type=review&ids=${encodeURIComponent(reviewIds.join(','))}`, { cache: 'no-store' }) : null,
                        mediaIds.length ? fetch(`/api/likes/batch?type=media&ids=${encodeURIComponent(mediaIds.join(','))}`, { cache: 'no-store' }) : null,
                    ]);

                    const applySeeds = async (res: Response | null, items: LikedPost[]) => {
                        if (!res || !res.ok) return {} as Record<string, { count: number; liked: boolean }>;
                        const { counts, liked } = await res.json();
                        const likeMap: Record<string, number> = {};
                        const likedSet = new Set<string>((liked || []).map((r: LikeData) => r.post_id));
                        (counts || []).forEach((r: CountData) => { likeMap[r.post_id] = r.like_count ?? 0; });
                        const seedMap: Record<string, { count: number; liked: boolean }> = {};
                        items.forEach((l) => {
                            const id = l.post!._id;
                            seedMap[id] = { count: likeMap[id] ?? 0, liked: likedSet.has(id) };
                        });
                        return seedMap;
                    };

                    const [reviewSeeds, mediaSeeds] = await Promise.all([
                        applySeeds(reviewRes, reviews),
                        applySeeds(mediaRes, media),
                    ]);

                    likes = likes.map((l) => {
                        const post = l.post ? { ...l.post } : null;
                        if (post) {
                            const seed = (l.post_type === 'review' ? reviewSeeds[post._id] : mediaSeeds[post._id]) || { count: 0, liked: false };
                            (post as LikedPost['post'] & { __seed: { count: number; liked: boolean } }).__seed = seed;
                        }
                        return { ...l, post } as LikedPost;
                    });
                } catch { }

                setLikedPosts(likes);
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl mb-8 shadow-lg"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                        <div className="grid gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl shadow-md"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
                        <p className="text-lg text-gray-600">Unable to load your profile.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8 pb-16">
            <div className="w-full max-w-5xl mx-auto px-4">
                {/* Profile Header */}
                <Card className="mb-8 overflow-hidden border-0 shadow-xl bg-gradient-to-r from-white to-gray-50">
                    <CardContent className="p-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                            <div className="relative">
                                {profile.avatar_color ? (
                                    <div className="h-28 w-28 rounded-full ring-4 ring-white shadow-lg" style={{ backgroundColor: profile.avatar_color }} />
                                ) : (
                                    <Avatar className="h-28 w-28 ring-4 ring-white shadow-lg">
                                        <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
                                        <AvatarFallback className="text-3xl font-bold">
                                            {profile.username?.charAt(0)?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 w-full">
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                                        {profile.display_name || profile.username || ""}
                                    </h1>
                                    <span className={`inline-flex items-center rounded-full text-sm font-medium px-3 py-1 self-center sm:self-auto mx-auto sm:mx-0 w-auto max-w-max shrink-0 ${profile.is_public
                                        ? "bg-green-100 text-green-800 border border-green-200"
                                        : "bg-gray-100 text-gray-800 border border-gray-200"
                                        }`}>
                                        {profile.is_public ? "Public" : "Private"}
                                    </span>
                                </div>
                                <p className="text-lg text-gray-600 font-medium mb-2 break-words">@{profile.username}</p>
                                {profile.bio && (
                                    <p className="text-gray-700 text-lg leading-relaxed break-words max-w-2xl">{profile.bio}</p>
                                )}
                            </div>
                            {profile?.id === session?.user?.id && (
                                <Link href="/profile/edit" className="self-center sm:self-auto sm:ml-auto">
                                    <Button variant="outline" size="lg" className="whitespace-nowrap bg-white hover:bg-gray-50 border-gray-300 shadow-sm">
                                        <Settings className="h-5 w-5 mr-2" />
                                        Edit Profile
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Liked Posts Section */}
                <Card className="border-0 shadow-lg bg-white">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-500" />
                            Liked Posts ({likedPosts.length})
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                    setLoading(true);
                                    await fetchProfile();
                                }}
                            >
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {likedPosts.length === 0 ? (
                            <div className="text-center py-8">
                                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No liked posts yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Start exploring and like posts you enjoy!
                                </p>
                                <Button asChild>
                                    <Link href="/reviews">Browse Reviews</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {likedPosts.map((item) => {
                                    if (!item.post) return null;
                                    const key = `${item.post_type}-${item.post_id}`;
                                    if (item.post_type === "media") {
                                        const media = {
                                            _id: item.post._id,
                                            title: item.post.title || "",
                                            slug: item.post.slug || { current: "" },
                                            publishedAt: item.post.publishedAt || new Date().toISOString(),
                                            artist: { name: item.post.artist?.name || "", slug: { current: "" } },
                                            coverUrl: item.post.coverUrl || undefined,
                                            videoUrl: (item.post as any).videoUrl || undefined,
                                            __seed: (item.post as any).__seed || { count: 0, liked: true },
                                        } as Media;
                                        return <MediaCard key={key} media={media} />;
                                    }
                                    const review = {
                                        _id: item.post._id,
                                        title: item.post.title || "",
                                        slug: item.post.slug || { current: "" },
                                        publishedAt: item.post.publishedAt || new Date().toISOString(),
                                        artist: { name: item.post.artist?.name || "", slug: { current: "" } },
                                        coverUrl: item.post.coverUrl || undefined,
                                        blurb: undefined,
                                        __seed: (item.post as any).__seed || { count: 0, liked: true },
                                    } as Review;
                                    return <ReviewCard key={key} review={review} />;
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Comments */}
                <Card className="mt-8 border-0 shadow-lg bg-white">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <CardTitle className="text-xl font-semibold text-gray-900">Recent Comments ({comments.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {comments.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                                <p className="text-gray-600">Start engaging with posts to see your comments here!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {comments.map((c) => {
                                    const href = c.link || `/${c.post_type === 'review' ? 'reviews' : 'media'}/${c.post_id}#comment-${c.id}`;
                                    const isOwner = session?.user?.id === requestedUserId;
                                    return (
                                        <div key={c.id} className="group relative bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-gray-300">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <Link href={href} className="block">
                                                        <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 truncate">
                                                            {c.target_title || c.post_type}
                                                        </h4>
                                                    </Link>

                                                    <div className="mt-2 prose prose-sm max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: c.body }} />

                                                    <div className="flex items-center justify-between mt-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                                                <ArrowUp className="h-3 w-3 text-green-500" />
                                                                <span>{c.up_count || 0}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                                                <ArrowDown className="h-3 w-3 text-red-500" />
                                                                <span>{c.down_count || 0}</span>
                                                            </div>
                                                            <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                                {c.score || 0}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500 font-mono">
                                                                {new Date(c.created_at).toLocaleDateString()}
                                                            </span>
                                                            {isOwner && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => deleteComment(c.id)}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 py-8" />}>
            <ProfilePageInner />
        </Suspense>
    );
}

