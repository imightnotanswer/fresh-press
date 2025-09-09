"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Reply, ChevronDown, ChevronRight } from "lucide-react";
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
}

export default function CommentNode({
    comment,
    postType,
    postId,
    depth = 0,
    onReply
}: CommentNodeProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);

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
                                <span className="text-sm font-medium text-gray-900">
                                    User {comment.user_id.slice(0, 8)}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                            </div>
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

                        <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: comment.body }}
                        />

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


