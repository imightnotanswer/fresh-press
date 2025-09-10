"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LikeButtonProps {
    postId: string;
    postType: "review" | "media";
    initialLiked?: boolean;
    onLikeChange?: (liked: boolean) => void;
    showCount?: boolean;
    hideLabel?: boolean;
    initialCount?: number | null;
}

export default function LikeButton({ postId, postType, initialLiked = false, onLikeChange, showCount = false, hideLabel = false, initialCount = null }: LikeButtonProps) {
    const { data: session } = useSession();
    const [liked, setLiked] = useState<boolean>(initialLiked);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState<number>(typeof initialCount === 'number' ? initialCount : 0);

    const handleLike = async () => {
        if (!session?.user?.id) {
            // Redirect to sign in
            window.location.href = "/signin";
            return;
        }

        // Optimistic update using seeds; do not refetch on success
        setLoading(true);
        const prevLiked = liked;
        const prevCount = count;
        const nextLiked = !prevLiked;
        setLiked(nextLiked);
        if (showCount) setCount(prev => Math.max(0, prev + (nextLiked ? 1 : -1)));

        try {
            if (nextLiked) {
                const res = await fetch("/api/likes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ postId, postType }),
                });
                if (!res.ok) throw new Error(await res.text());
            } else {
                const res = await fetch(`/api/likes?postId=${postId}&postType=${postType}`, { method: "DELETE" });
                if (!res.ok) throw new Error(await res.text());
            }
        } catch (error) {
            // revert on failure
            setLiked(prevLiked);
            if (showCount) setCount(prevCount);
            console.error("Error toggling like:", error);
        } finally {
            setLoading(false);
        }
    };

    // If not signed in, show count and redirect on click
    if (!session) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = "/api/auth/signin"}
                className="flex items-center gap-1 text-gray-500 hover:text-red-500"
            >
                <Heart className="h-4 w-4" />
                {!hideLabel && <span>Like</span>}
                {showCount && (hideLabel
                    ? <span className="ml-1 text-xs">{typeof count === 'number' ? count : 0}</span>
                    : <span className="ml-1 text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">{typeof count === 'number' ? count : 0}</span>
                )}
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
            {!hideLabel && <span>{liked ? "Liked" : "Like"}</span>}
            {showCount && (hideLabel
                ? <span className="ml-1 text-xs">{typeof count === 'number' ? count : 0}</span>
                : <span className="ml-1 text-xs rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">{typeof count === 'number' ? count : 0}</span>
            )}
        </Button>
    );
}



