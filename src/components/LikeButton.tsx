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
}

export default function LikeButton({ postId, postType, initialLiked = false, onLikeChange }: LikeButtonProps) {
    const { data: session } = useSession();
    const [liked, setLiked] = useState(initialLiked);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session?.user?.id) {
            checkLikeStatus();
        }
    }, [session, postId, postType]);

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
        </Button>
    );
}
