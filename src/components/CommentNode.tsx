"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Reply, ChevronDown, ChevronRight, Edit2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
    id: string;
    body: string;
    created_at: string;
    user_id: string;
    children: Comment[];
}

interface CommentNodeProps {
    comment: Comment;
    postType: string;
    postId: string;
    depth?: number;
    onReply?: (parentId: string, body: string) => void;
    onReload?: () => void;
}

export default function CommentNode({
    comment,
    postType,
    postId,
    depth = 0,
    onReply,
    onReload
}: CommentNodeProps) {
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(stripHtml(comment.body));
    const [score, setScore] = useState((comment as any).score || 0);
    const [userVote, setUserVote] = useState<number>((comment as any).user_vote || 0);
    const vote = async (val: 1 | -1 | 0) => {
        const res = await fetch('/api/comments/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentId: comment.id, value: val })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && typeof data.score === 'number') {
            setScore(data.score);
            setUserVote(val);
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
            <Card className="mb-2" id={`comment-${comment.id}`}>
                <CardContent className="p-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center gap-1 mr-2">
                                    <Button variant={userVote === 1 ? "default" : "ghost"} size="sm" onClick={() => vote(userVote === 1 ? 0 : 1)}><ArrowUp className="h-4 w-4" /></Button>
                                    <span className="text-sm font-medium">{score}</span>
                                    <Button variant={userVote === -1 ? "default" : "ghost"} size="sm" onClick={() => vote(userVote === -1 ? 0 : -1)}><ArrowDown className="h-4 w-4" /></Button>
                                </div>
                                <Link href={`/profile?userId=${comment.user_id}`} className="text-sm font-medium text-gray-900 inline-flex items-center gap-2">
                                    {(comment as any).avatar_url ? (
                                        <img src={(comment as any).avatar_url as any} alt="avatar" className="h-6 w-6 rounded-full" />
                                    ) : (
                                        <div className="h-6 w-6 rounded-full" style={{ backgroundColor: (comment as any).avatar_color || '#e5e7eb' }} />
                                    )}
                                    {(comment as any).author_name || `User ${comment.user_id.slice(0, 8)}`}
                                </Link>
                                <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    {(comment as any).updated_at && new Date((comment as any).updated_at).getTime() > new Date(comment.created_at).getTime() && (
                                        <span className="ml-1">(edited)</span>
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => {
                                    if (!isEditing) setEditText(stripHtml(comment.body));
                                    setIsEditing((v) => !v);
                                }}>
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                        await fetch(`/api/comments?id=${comment.id}`, { method: 'DELETE' });
                                        onReload?.();
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                {comment.children.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsExpanded(!isExpanded)}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="space-y-2">
                                <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={async () => {
                                        await fetch('/api/comments', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ id: comment.id, body: editText })
                                        });
                                        setIsEditing(false);
                                        onReload?.();
                                    }}>Save</Button>
                                    <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditText(stripHtml(comment.body)); }}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: comment.body }}
                            />
                        )}

                        {shouldShowReply && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsReplying(!isReplying)}
                                className="text-xs"
                            >
                                <Reply className="h-3 w-3 mr-1" />
                                Reply
                            </Button>
                        )}

                        {isReplying && (
                            <div className="space-y-2">
                                <Textarea
                                    placeholder="Write a reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className="min-h-[80px]"
                                />
                                <div className="flex space-x-2">
                                    <Button size="sm" onClick={handleReply}>
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
                </CardContent>
            </Card>

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


