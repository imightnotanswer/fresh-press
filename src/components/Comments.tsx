"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import CommentNode from "./CommentNode";

interface Comment {
    id: string;
    body: string;
    created_at: string;
    user_id: string;
    updated_at?: string;
    author_name?: string;
    score?: number;
    children: Comment[];
}

interface CommentsProps {
    postType: "review" | "media";
    postId: string;
}

export default function Comments({ postType, postId }: CommentsProps) {
    const { data: session } = useSession();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchComments();
    }, [postType, postId]);

    const fetchComments = async () => {
        try {
            const response = await fetch(`/api/comments/list?postType=${postType}&postId=${postId}`);
            if (response.ok) {
                const data = await response.json();
                setComments(data);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // ----- helpers for optimistic updates -----
    const updateTree = (nodes: Comment[], id: string, fn: (n: Comment) => Comment): Comment[] =>
        nodes.map((n) => {
            if (n.id === id) {
                return fn({ ...n });
            }
            if (n.children?.length) {
                return { ...n, children: updateTree(n.children, id, fn) };
            }
            return n;
        });

    const sortTree = (nodes: Comment[]) => {
        nodes.sort(
            (a: any, b: any) => ((b.score || 0) - (a.score || 0)) || (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        );
        nodes.forEach((n) => sortTree(n.children));
    };

    const handleVoteUpdate = (id: string, newScore: number) => {
        const next = updateTree(comments, id, (n) => ({ ...n, score: newScore }));
        sortTree(next);
        setComments([...next]);
    };

    const handleEdited = (id: string, newBody: string, updatedAt?: string) => {
        const next = updateTree(comments, id, (n) => ({ ...n, body: newBody, updated_at: updatedAt || new Date().toISOString() }));
        setComments([...next]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !newComment.trim()) return;

        setIsSubmitting(true);
        try {
            // For now, we'll skip hCaptcha in development
            const response = await fetch("/api/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    postType,
                    postId,
                    body: newComment,
                    hcaptchaToken: "dev-token", // Replace with actual hCaptcha token
                }),
            });

            if (response.ok) {
                const created = await response.json();
                setNewComment("");
                // Optimistic append at top-level
                setComments((prev) => [
                    { id: created.id, body: created.body, created_at: created.created_at, user_id: created.user_id, children: [] },
                    ...prev,
                ]);
                toast({
                    title: "Comment posted",
                    description: "Your comment has been posted successfully.",
                });
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.error || "Failed to post comment",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error posting comment:", error);
            toast({
                title: "Error",
                description: "Failed to post comment",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = async (parentId: string, body: string) => {
        if (!session) return;

        try {
            const response = await fetch("/api/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    postType,
                    postId,
                    parentId,
                    body,
                    hcaptchaToken: "dev-token", // Replace with actual hCaptcha token
                }),
            });

            if (response.ok) {
                const created = await response.json();
                // Re-fetch to merge into proper tree or optimistically place under parent
                await fetchComments();
                toast({
                    title: "Reply posted",
                    description: "Your reply has been posted successfully.",
                });
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.error || "Failed to post reply",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error posting reply:", error);
            toast({
                title: "Error",
                description: "Failed to post reply",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Comments ({comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {session ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                            {isSubmitting ? "Posting..." : "Post Comment"}
                        </Button>
                    </form>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">Sign in to post comments</p>
                        <Button onClick={() => window.location.href = "/api/auth/signin"}>
                            Sign In
                        </Button>
                    </div>
                )}

                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                    ) : (
                        comments.map((comment) => (
                            <CommentNode
                                key={comment.id}
                                comment={comment}
                                postType={postType}
                                postId={postId}
                                onReply={handleReply}
                                onReload={fetchComments}
                                onVote={handleVoteUpdate}
                                onEdited={handleEdited}
                            />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


