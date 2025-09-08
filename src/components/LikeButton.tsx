"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LikeButtonProps {
    postId: string;
    postType: "review" | "media";
    initialLiked?: boolean;
    onLikeChange?: (liked: boolean) => void;
    showCount?: boolean;
}

export default function LikeButton({ postId, postType, initialLiked = false, onLikeChange, showCount = false }: LikeButtonProps) {
    const { data: session } = useSession();
    const [liked, setLiked] = useState(initialLiked);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        if (session?.user?.id) {
            checkLikeStatus();
        }
        if (showCount) {
            fetchCount();
        }
    }, [session, postId, postType, showCount]);

    const checkLikeStatus = async () => {
        try {
            const response = await fetch(`/api/likes?postId=${postId}&postType=${postType}`);
            if (response.ok) {
                const data = await response.json();
                setLiked(data.liked);
            }
        } catch (error) {
            console.error("Error checking like status:", error);
        }
    };

    const fetchCount = async () => {
        try {
            const response = await fetch(`/api/likes?postId=${postId}&postType=${postType}&count=1`);
            if (response.ok) {
                const data = await response.json();
                if (typeof data.count === 'number') setCount(data.count);
            }
        } catch (error) {
            console.error("Error fetching like count:", error);
        }
    };

    const handleLike = async () => {
        if (!session?.user?.id) {
            // Redirect to sign in or show modal
            window.location.href = "/api/auth/signin";
            return;
        }

        setLoading(true);
        try {
            if (liked) {
                // Unlike
                const response = await fetch(`/api/likes?postId=${postId}&postType=${postType}`, {
                    method: "DELETE",
                });
                if (response.ok) {
                    setLiked(false);
                    onLikeChange?.(false);
                    if (showCount) fetchCount();
                }
            } else {
                // Like
                const response = await fetch("/api/likes", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        postId,
                        postType,
                    }),
                });
                if (response.ok) {
                    setLiked(true);
                    onLikeChange?.(true);
                    if (showCount) fetchCount();
                }
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/auth/signin"}
                className="flex items-center gap-1 text-gray-500 hover:text-red-500"
            >
                <Heart className="h-4 w-4" />
                <span>Like</span>
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={loading}
            className={`flex items-center gap-1 transition-colors ${liked
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-500 hover:text-red-500"
                }`}
        >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
            <span>{liked ? "Liked" : "Like"}</span>
            {showCount && (
                <span className="ml-1 text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">
                    {count ?? "–"}
                </span>
            )}
        </Button>
    );
}



