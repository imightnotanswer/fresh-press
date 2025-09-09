"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { redirect, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, User, Settings } from "lucide-react";
import MediaCard from "@/components/MediaCard";
import ReviewCard from "@/components/ReviewCard";
import Link from "next/link";

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
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                setLikedPosts(data.likes);
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
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
                        <div className="grid gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-24 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
                        <p className="text-gray-600">Unable to load your profile.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Profile Header */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                            {profile.avatar_color ? (
                                <div className="h-24 w-24 rounded-full" style={{ backgroundColor: profile.avatar_color }} />
                            ) : (
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={profile.avatar_url || ""} alt={profile.display_name} />
                                    <AvatarFallback>
                                        <User className="h-12 w-12" />
                                    </AvatarFallback>
                                </Avatar>
                            )}
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2">
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {profile.display_name || profile.username || ""}
                                    </h1>
                                    <Badge variant={profile.is_public ? "default" : "secondary"}>
                                        {profile.is_public ? "Public" : "Private"}
                                    </Badge>
                                </div>
                                <p className="text-gray-600 mb-2">@{profile.username}</p>
                                {profile.bio && (
                                    <p className="text-gray-700">{profile.bio}</p>
                                )}
                            </div>
                            {profile?.id === session?.user?.id && (
                                <Link href="/profile/edit">
                                    <Button variant="outline" size="sm">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Liked Posts Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
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
                                        } as any;
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
                                    } as any;
                                    return <ReviewCard key={key} review={review} />;
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Comments */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Recent Comments ({comments.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {comments.length === 0 ? (
                            <p className="text-gray-600">No comments yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {comments.map((c) => {
                                    const href = (c as any).link || `/${c.post_type === 'review' ? 'reviews' : 'media'}/${c.post_id}#comment-${c.id}`;
                                    return (
                                        <div key={c.id} className="p-3 border rounded">
                                            <Link href={href} className="font-medium hover:underline">
                                                {(c as any).target_title || c.post_type}
                                            </Link>
                                            <div className="prose prose-sm max-w-none mt-1" dangerouslySetInnerHTML={{ __html: c.body }} />
                                            <p className="text-xs text-gray-500 mt-1">{new Date(c.created_at).toLocaleString()}</p>
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

