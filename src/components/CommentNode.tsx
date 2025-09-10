"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Reply, ChevronDown, ChevronRight, Edit2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";

interface Comment {
    id: string;
    body: string;
    created_at: string;
    user_id: string;
    children: Comment[];
    deleted?: boolean;
    score?: number;
    up_count?: number;
    down_count?: number;
    my_vote?: number;
    avatar_url?: string | null;
    avatar_color?: string | null;
    username?: string;
    display_name?: string;
    updated_at?: string;
}

interface VoteResponse {
    success: boolean;
    newScore?: number;
    error?: string;
}

interface CommentNodeProps {
    comment: Comment;
    postType: string;
    postId: string;
    depth?: number;
    onReply?: (parentId: string, body: string) => void;
    onReload?: () => void;
    onVote?: (id: string, newScore: number) => void;
    onEdited?: (id: string, newBody: string, updatedAt?: string) => void;
    onDelete?: (id: string) => void;
}

export default function CommentNode({
    comment,
    postType,
    postId,
    depth = 0,
    onReply,
    onReload,
    onVote,
    onEdited,
    onDelete
}: CommentNodeProps) {
    const { data: session } = useSession();
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(stripHtml(comment.body));
    const [score, setScore] = useState(comment.score ?? 0);
    const [userVote, setUserVote] = useState<number>(comment.my_vote ?? 0);
    const [busy, setBusy] = useState(false);

    // Check if current user owns this comment
    const isOwner = session?.user?.id === comment.user_id;
    const vote = async (direction: 1 | -1) => {
        if (busy) return;
        setBusy(true);

        const prev = userVote as -1 | 0 | 1;
        let next: -1 | 0 | 1;

        // Toggle logic: if clicking same direction, remove vote; otherwise set to new direction
        if (prev === direction) {
            next = 0; // Remove vote
        } else {
            next = direction; // Set to new direction
        }

        const delta = next - prev;
        const prevScore = score;

        // Apply optimistic update
        setUserVote(next);
        setScore(prevScore + delta);

        try {
            const res = await fetch('/api/comments/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentId: comment.id, value: next })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && typeof data.score === 'number') {
                // snap to server score for determinism
                setScore(data.score);
                setUserVote(data.my_vote ?? next);
                onVote?.(comment.id, data.score);
            } else if (res.status === 401) {
                window.location.href = '/signin';
            } else {
                // revert on error
                setUserVote(prev);
                setScore(prevScore);
            }
        } catch {
            setUserVote(prev);
            setScore(prevScore);
        } finally {
            setBusy(false);
        }
    };

    const handleReply = () => {
        if (replyText.trim() && onReply) {
            onReply(comment.id, replyText);
            setReplyText("");
            setIsReplying(false);
        }
    };

    const maxDepth = 5;
    const shouldShowReply = depth < maxDepth;

    return (
        <div className={`${depth > 0 ? "ml-4 border-l-2 border-gray-200 pl-4" : ""}`}>
            <div className="group relative bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-gray-300 mb-3" id={`comment-${comment.id}`}>
                <div className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            {!comment.deleted && (
                                <div className="flex items-center gap-1 mr-2">
                                    <Button variant={userVote === 1 ? "default" : "ghost"} size="sm" disabled={busy} onClick={() => vote(1)} className="h-8 w-8 p-0">
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium min-w-[20px] text-center">{score}</span>
                                    <Button variant={userVote === -1 ? "default" : "ghost"} size="sm" disabled={busy} onClick={() => vote(-1)} className="h-8 w-8 p-0">
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <Link href={`/profile?userId=${comment.user_id}`} className="text-sm font-medium text-gray-900 inline-flex items-center gap-2 hover:text-blue-600 transition-colors duration-200">
                                {comment.avatar_url ? (
                                    <img src={comment.avatar_url} alt="avatar" className="h-6 w-6 rounded-full ring-2 ring-white shadow-sm" />
                                ) : (
                                    <div className="h-6 w-6 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: comment.avatar_color || '#e5e7eb' }} />
                                )}
                                {comment.deleted ? (
                                    <span className="italic text-gray-500">deleted</span>
                                ) : (
                                    comment.display_name || comment.username || `User ${comment.user_id.slice(0, 8)}`
                                )}
                            </Link>
                            <span className="text-xs text-gray-500 font-mono">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                {comment.updated_at && new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime() && (
                                    <span className="ml-1">(edited)</span>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {isOwner && !comment.deleted && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (!isEditing) setEditText(stripHtml(comment.body));
                                            setIsEditing((v) => !v);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 h-6 w-6"
                                    >
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                // Optimistic deletion - remove immediately from UI
                                                onDelete?.(comment.id);

                                                const response = await fetch(`/api/comments?id=${comment.id}`, { method: 'DELETE' });
                                                if (!response.ok) {
                                                    console.error('Failed to delete comment');
                                                    // If deletion failed, reload to restore the comment
                                                    onReload?.();
                                                }
                                            } catch (error) {
                                                console.error('Error deleting comment:', error);
                                                // If deletion failed, reload to restore the comment
                                                onReload?.();
                                            }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </>
                            )}
                            {comment.children.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 h-6 w-6"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-3 w-3" />
                                    ) : (
                                        <ChevronRight className="h-3 w-3" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-3 mt-3">
                            <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="min-h-[100px] resize-none"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={async () => {
                                        await fetch('/api/comments', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ id: comment.id, body: editText })
                                        });
                                        setIsEditing(false);
                                        onEdited?.(comment.id, editText, new Date().toISOString());
                                        onReload?.();
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditText(stripHtml(comment.body));
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-3">
                            <div
                                className={`prose prose-sm max-w-none text-gray-700 leading-relaxed ${comment.deleted ? 'italic text-gray-500' : ''}`}
                                dangerouslySetInnerHTML={{ __html: comment.body }}
                            />
                        </div>
                    )}

                    {shouldShowReply && !comment.deleted && (
                        <div className="mt-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsReplying(!isReplying)}
                                className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-1 rounded-full"
                            >
                                <Reply className="h-3 w-3 mr-1" />
                                Reply
                            </Button>
                        </div>
                    )}

                    {isReplying && (
                        <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg border">
                            <Textarea
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-[80px] resize-none"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleReply}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Reply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsReplying(false);
                                        setReplyText("");
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && comment.children.length > 0 && (
                <div className="space-y-2">
                    {comment.children.map((child) => (
                        <CommentNode
                            key={child.id}
                            comment={child}
                            postType={postType}
                            postId={postId}
                            depth={depth + 1}
                            onReply={onReply}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}


