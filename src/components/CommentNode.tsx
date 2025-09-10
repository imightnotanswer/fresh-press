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
    author_name?: string;
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
        <div className={`${depth > 0 ? "ml-6 border-l-2 border-orange-400 pl-4" : ""}`}>
            <div className="group relative bg-gradient-to-br from-white to-orange-50 border border-orange-200 rounded-2xl p-5 hover:shadow-2xl hover:border-orange-400 transition-all duration-300 mb-4" id={`comment-${comment.id}`}>
                <div className="space-y-4">
                    {/* Header with user info and voting */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                            {comment.deleted ? (
                                <div className="text-sm font-medium text-gray-500 inline-flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                        <span className="text-xs">?</span>
                                    </div>
                                    <span className="italic">deleted</span>
                                </div>
                            ) : (
                                <Link href={`/profile?userId=${comment.user_id}`} className="text-sm font-medium text-gray-900 inline-flex items-center gap-3 hover:text-orange-600 transition-colors duration-200">
                                    {comment.avatar_url ? (
                                        <img src={comment.avatar_url} alt="avatar" className="h-8 w-8 rounded-full ring-2 ring-orange-300 shadow-lg" />
                                    ) : (
                                        <div className="h-8 w-8 rounded-full ring-2 ring-orange-300 shadow-lg flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br from-orange-400 to-pink-500">
                                            {(comment.author_name || comment.display_name || comment.username || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">{comment.author_name || comment.display_name || comment.username || `User ${comment.user_id.slice(0, 8)}`}</span>
                                        <span className="text-xs text-gray-500">
                                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                            {comment.updated_at && new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime() && (
                                                <span className="ml-1">(edited)</span>
                                            )}
                                        </span>
                                    </div>
                                </Link>
                            )}
                        </div>

                        {/* Voting controls - right side */}
                        {!comment.deleted && (
                            <div className="flex flex-col items-center gap-1">
                                <Button
                                    variant={userVote === 1 ? "default" : "ghost"}
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => vote(1)}
                                    className={`h-7 w-7 p-0 rounded-full transition-all duration-200 ${userVote === 1
                                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                                        : 'text-gray-400 hover:text-green-500 hover:bg-green-100'
                                        }`}
                                >
                                    <ArrowUp className="h-3 w-3" />
                                </Button>
                                <span className="text-xs font-semibold text-gray-700 min-w-[16px] text-center">{score}</span>
                                <Button
                                    variant={userVote === -1 ? "default" : "ghost"}
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => vote(-1)}
                                    className={`h-7 w-7 p-0 rounded-full transition-all duration-200 ${userVote === -1
                                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-100'
                                        }`}
                                >
                                    <ArrowDown className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Comment body */}
                    {isEditing ? (
                        <div className="space-y-4">
                            <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="min-h-[100px] resize-none border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                            />
                            <div className="flex gap-3">
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
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
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
                                    className="border-orange-200 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-800 leading-relaxed">
                            {comment.deleted ? (
                                <div className="italic text-gray-500 text-sm">
                                    [deleted]
                                </div>
                            ) : (
                                <div
                                    className="prose prose-sm max-w-none break-words text-gray-800"
                                    dangerouslySetInnerHTML={{ __html: comment.body }}
                                />
                            )}
                        </div>
                    )}

                    {/* Action buttons at the bottom */}
                    <div className="flex items-center justify-between pt-2 border-t border-orange-100">
                        <div className="flex items-center gap-2">
                            {shouldShowReply && !comment.deleted && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsReplying(!isReplying)}
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-3 py-2 rounded-lg text-sm font-medium"
                                >
                                    <Reply className="h-4 w-4 mr-2" />
                                    Reply
                                </Button>
                            )}
                            {comment.children.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm"
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronDown className="h-4 w-4 mr-2" />
                                            Hide replies
                                        </>
                                    ) : (
                                        <>
                                            <ChevronRight className="h-4 w-4 mr-2" />
                                            Show replies ({comment.children.length})
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        {/* Edit/Delete buttons for owner */}
                        {isOwner && !comment.deleted && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        if (!isEditing) setEditText(stripHtml(comment.body));
                                        setIsEditing((v) => !v);
                                    }}
                                    className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg"
                                    title="Edit comment"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        onDelete?.(comment.id);
                                    }}
                                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg"
                                    title="Delete comment"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {isReplying && (
                        <div className="space-y-4 mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
                            <Textarea
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="min-h-[80px] resize-none border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                            />
                            <div className="flex gap-3">
                                <Button
                                    size="sm"
                                    onClick={handleReply}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
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
                                    className="border-orange-200 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg"
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
                            onReload={onReload}
                            onVote={onVote}
                            onEdited={onEdited}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}


