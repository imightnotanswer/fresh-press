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
    display_name?: string;
    username?: string;
    score?: number;
    up_count?: number;
    down_count?: number;
    my_vote?: number;
    parent_id?: string | null;
    deleted?: boolean;
    children: Comment[];
    avatar_url?: string | null;
    avatar_color?: string | null;
}

interface CreateCommentResponse {
    success: boolean;
    comment?: Comment;
    error?: string;
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
            // Add cache-busting parameter to ensure fresh data
            const response = await fetch(`/api/comments/list?postType=${postType}&postId=${postId}&t=${Date.now()}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched comments data:', data);
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
        nodes.sort((a: Comment, b: Comment) => {
            // First, separate deleted and non-deleted comments
            if (a.deleted && !b.deleted) {
                return 1; // a (deleted) goes after b (not deleted)
            }
            if (!a.deleted && b.deleted) {
                return -1; // a (not deleted) goes before b (deleted)
            }

            // If both are deleted or both are not deleted, sort by score
            const scoreA = a.score || 0;
            const scoreB = b.score || 0;

            // Sort by score (higher first)
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }
            // Then by creation time (older first)
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
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


    const handleDelete = async (id: string) => {
        if (!session) return;

        try {
            // Call server API and get patch information
            const response = await fetch(`/api/comments?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                console.error('Failed to delete comment');
                return;
            }

            const responseData = await response.json() as {
                id: string,
                mode: 'soft' | 'hard',
                movedChildren: string[]
            };
            const { mode, movedChildren } = responseData;

            if (mode === 'soft') {
                // Mark comment as deleted in place (keep children as replies)
                const next = updateTree(comments, id, (n) => ({ ...n, deleted: true, body: '[deleted]' }));
                setComments([...next]);
            } else {
                // hard delete: remove the node entirely (leaf)
                setComments(prev => {
                    const remove = (nodes: Comment[]): Comment[] =>
                        nodes
                            .filter(n => n.id !== id)
                            .map(n => ({ ...n, children: n.children ? remove(n.children) : [] }));
                    return remove(prev);
                });
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            // Fallback: full refetch keeps you safe
            await fetchComments();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !newComment.trim()) return;

        const commentText = newComment.trim();
        setNewComment(""); // Clear input immediately
        setIsSubmitting(true);

        // Get user's display name and avatar color for optimistic comment
        let displayName = session.user.name || session.user.email?.split('@')[0] || 'User';
        let avatarColor = (session.user as { avatar_color?: string }).avatar_color;


        try {
            const response = await fetch('/api/profile');
            if (response.ok) {
                const profile = await response.json();
                displayName = profile.username || displayName;
                avatarColor = profile.avatar_color || avatarColor;
            }
        } catch (error) {
            console.log('Could not fetch profile for optimistic comment, using fallback');
        }

        // Store the fetched data for use in replacement
        const fetchedDisplayName = displayName;
        const fetchedAvatarColor = avatarColor;

        // Create optimistic comment that appears instantly
        const tempId = `temp-${Date.now()}`;
        const optimisticComment = {
            id: tempId,
            body: commentText,
            created_at: new Date().toISOString(),
            user_id: session.user.id,
            children: [],
            author_name: displayName,
            avatar_color: avatarColor,
            score: 0,
            up_count: 0,
            down_count: 0,
            my_vote: 0,
            deleted: false,
            isOptimistic: true // Flag to identify optimistic comment
        };

        // Add optimistic comment immediately
        setComments((prev) => [optimisticComment, ...prev]);

        try {
            // Make API call
            const response = await fetch("/api/comments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    postType,
                    postId,
                    body: commentText,
                    hcaptchaToken: "dev-token", // Replace with actual hCaptcha token
                }),
            });

            if (response.ok) {
                const created = await response.json();

                // Replace optimistic comment with real data
                setComments((prev) =>
                    prev.map(comment =>
                        comment.id === tempId
                            ? {
                                ...created,
                                children: [],
                                author_name: created.author_name || fetchedDisplayName,
                                avatar_color: fetchedAvatarColor,
                                score: 0,
                                up_count: 0,
                                down_count: 0,
                                my_vote: 0,
                                deleted: false
                            }
                            : comment
                    )
                );

                toast({
                    title: "Comment posted",
                    description: "Your comment has been posted successfully.",
                });
            } else {
                // Remove optimistic comment on error
                setComments((prev) => prev.filter(comment => comment.id !== tempId));
                setNewComment(commentText); // Restore the comment text

                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.error || "Failed to post comment",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error posting comment:", error);
            // Remove optimistic comment on error
            setComments((prev) => prev.filter(comment => comment.id !== tempId));
            setNewComment(commentText); // Restore the comment text

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

        // Get user's display name and avatar color for optimistic reply
        let displayName = session.user.name || session.user.email?.split('@')[0] || 'User';
        let avatarColor = (session.user as { avatar_color?: string }).avatar_color;

        try {
            const response = await fetch('/api/profile');
            if (response.ok) {
                const profile = await response.json();
                displayName = profile.username || displayName;
                avatarColor = profile.avatar_color || avatarColor;
            }
        } catch (error) {
            console.log('Could not fetch profile for optimistic reply, using fallback');
        }

        // Store the fetched data for use in replacement
        const fetchedDisplayName = displayName;
        const fetchedAvatarColor = avatarColor;

        // Create optimistic reply that appears instantly
        const tempId = `temp-reply-${Date.now()}`;
        const optimisticReply = {
            id: tempId,
            body: body,
            created_at: new Date().toISOString(),
            user_id: session.user.id,
            parent_id: parentId,
            children: [],
            author_name: displayName,
            avatar_color: avatarColor,
            score: 0,
            up_count: 0,
            down_count: 0,
            my_vote: 0,
            deleted: false,
            isOptimistic: true
        };

        // Add optimistic reply to the parent comment
        setComments((prev) => {
            const addReplyToParent = (comments: Comment[]): Comment[] =>
                comments.map(comment => {
                    if (comment.id === parentId) {
                        return { ...comment, children: [...comment.children, optimisticReply] };
                    }
                    if (comment.children.length > 0) {
                        return { ...comment, children: addReplyToParent(comment.children) };
                    }
                    return comment;
                });
            return addReplyToParent(prev);
        });

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

                // Replace optimistic reply with real data
                setComments((prev) => {
                    const updateReply = (comments: Comment[]): Comment[] =>
                        comments.map(comment => {
                            if (comment.id === parentId) {
                                return {
                                    ...comment,
                                    children: comment.children.map(child =>
                                        child.id === tempId
                                            ? {
                                                ...created,
                                                children: [],
                                                author_name: created.author_name || fetchedDisplayName,
                                                avatar_color: fetchedAvatarColor,
                                                score: 0,
                                                up_count: 0,
                                                down_count: 0,
                                                my_vote: 0,
                                                deleted: false
                                            }
                                            : child
                                    )
                                };
                            }
                            if (comment.children.length > 0) {
                                return { ...comment, children: updateReply(comment.children) };
                            }
                            return comment;
                        });
                    return updateReply(prev);
                });

                toast({
                    title: "Reply posted",
                    description: "Your reply has been posted successfully.",
                });
            } else {
                // Remove optimistic reply on error
                setComments((prev) => {
                    const removeReply = (comments: Comment[]): Comment[] =>
                        comments.map(comment => {
                            if (comment.id === parentId) {
                                return {
                                    ...comment,
                                    children: comment.children.filter(child => child.id !== tempId)
                                };
                            }
                            if (comment.children.length > 0) {
                                return { ...comment, children: removeReply(comment.children) };
                            }
                            return comment;
                        });
                    return removeReply(prev);
                });

                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.error || "Failed to post reply",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error posting reply:", error);
            // Remove optimistic reply on error
            setComments((prev) => {
                const removeReply = (comments: Comment[]): Comment[] =>
                    comments.map(comment => {
                        if (comment.id === parentId) {
                            return {
                                ...comment,
                                children: comment.children.filter(child => child.id !== tempId)
                            };
                        }
                        if (comment.children.length > 0) {
                            return { ...comment, children: removeReply(comment.children) };
                        }
                        return comment;
                    });
                return removeReply(prev);
            });

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
        <Card className="border-black">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-black">
                <CardTitle className="text-black">Comments ({comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                {session ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[100px] border-black focus:border-gray-600 focus:ring-gray-200"
                        />
                        <Button
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="bg-black hover:bg-gray-800 text-[#ddf0e0] px-6 py-2 rounded-lg"
                        >
                            {isSubmitting ? "Posting..." : "Post Comment"}
                        </Button>
                    </form>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">Sign in to post comments</p>
                        <Button
                            onClick={() => window.location.href = "/api/auth/signin"}
                            className="bg-black hover:bg-gray-800 text-[#ddf0e0] px-6 py-2 rounded-lg"
                        >
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
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}


