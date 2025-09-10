import { NextRequest, NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Type definitions
interface CommentRow {
    id: string;
    user_id: string;
    post_type: string;
    post_id: string;
    parent_id: string | null;
    body: string;
    created_at: string;
    deleted: boolean;
}

interface ScoreRow {
    comment_id: string;
    score: number;
    up_count: number;
    down_count: number;
}

interface VoteRow {
    comment_id: string;
    value: number;
}

interface ProfileRow {
    id: string;
    avatar_url: string | null;
    avatar_color: string | null;
    username: string | null;
}

interface CommentWithSeed {
    id: string;
    user_id: string;
    post_type: string;
    post_id: string;
    parent_id: string | null;
    body: string;
    created_at: string;
    deleted: boolean;
    score: number;
    up_count: number;
    down_count: number;
    my_vote: number;
    avatar_url: string | null;
    avatar_color: string | null;
    author_name: string;
    children: CommentWithSeed[];
}

export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: "Comments system not configured" }, { status: 503 });
        }

        const { searchParams } = new URL(request.url);
        const session = await getServerSession(authOptions);
        const postType = searchParams.get("postType");
        const postId = searchParams.get("postId");

        if (!postType || !postId) {
            return NextResponse.json({ error: "Missing postType or postId" }, { status: 400 });
        }

        // Prefer RPC that returns comments + counts + my_vote for correct first paint
        let data: CommentWithSeed[] | null = null;
        try {
            const rpc = await supabase.rpc('comments_for_post_with_user', {
                p_post_id: postId,
                p_type: postType,
                p_user_id: session?.user?.id || '',
                p_max: 1000,
            });
            if ((rpc as { error?: Error }).error) throw (rpc as { error: Error }).error;
            data = (rpc as { data: CommentWithSeed[] }).data || [];
        } catch (error) {
            // RPC unavailable, using manual list build (which works correctly)

            // --- Fallback: fetch comments, scores, my votes, and build tree ---
            const { data: commentsRows, error: commentsErr } = await supabase
                .from("comments")
                .select("*")
                .eq("post_type", postType)
                .eq("post_id", postId)
                .order("created_at", { ascending: true });
            if (commentsErr) {
                console.error("Error fetching comments:", commentsErr);
                return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
            }

            // Fetch vote scores from comment_scores table (aggregated)
            const commentIds = (commentsRows || []).map((c: CommentRow) => c.id);
            const { data: scoreRows } = await supabase
                .from('comment_scores')
                .select('comment_id, score, up_count, down_count')
                .in('comment_id', commentIds.length ? commentIds : ['-']);
            const scoreById: Record<string, { score: number, up_count: number, down_count: number }> = {};
            (scoreRows || []).forEach((s: ScoreRow) => {
                scoreById[s.comment_id] = {
                    score: s.score || 0,
                    up_count: s.up_count || 0,
                    down_count: s.down_count || 0
                };
            });

            // Current user's votes
            const myVoteById: Record<string, number> = {};
            if (session?.user?.id && (commentsRows?.length || 0) > 0) {
                const { data: myVotes } = await supabase
                    .from('comment_votes')
                    .select('comment_id, value')
                    .eq('user_id', session.user.id);
                (myVotes || []).forEach((v: VoteRow) => { myVoteById[v.comment_id] = Number(v.value) || 0; });
            }

            data = (commentsRows || []).map((row: CommentRow) => ({
                ...row,
                score: scoreById[row.id]?.score || 0,
                up_count: scoreById[row.id]?.up_count || 0,
                down_count: scoreById[row.id]?.down_count || 0,
                my_vote: myVoteById[row.id] || 0,
                avatar_url: null,
                avatar_color: null,
                children: [],
            }));
        }

        // Fetch avatars/colors and usernames for authors
        const userIds = (data || []).map((c: CommentWithSeed) => c.user_id);
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, avatar_url, avatar_color, username')
            .in('id', userIds.length ? userIds : ['-']);
        const avatarById: Record<string, { url: string | null, color: string | null, username: string | null }> = {};
        (profiles || []).forEach((p: ProfileRow) => {
            avatarById[p.id] = {
                url: p.avatar_url || null,
                color: p.avatar_color || null,
                username: p.username || null
            };
        });

        // Build nested tree structure
        const commentMap = new Map<string, CommentWithSeed>();
        const rootComments: CommentWithSeed[] = [];

        // First pass: create map of all comments
        data?.forEach((comment: CommentWithSeed) => {
            const av = avatarById[comment.user_id] || { url: null, color: null, username: null };
            commentMap.set(comment.id, {
                ...comment,
                avatar_url: av.url,
                avatar_color: av.color,
                // Always use current username from profile, never stored author_name
                author_name: av.username || `User ${comment.user_id.slice(0, 8)}`,
                children: []
            });
        });

        // Second pass: build tree structure
        data?.forEach((comment: CommentWithSeed) => {
            if (comment.parent_id) {
                // Add all child comments (deleted and non-deleted)
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    const child = commentMap.get(comment.id);
                    if (child) {
                        parent.children.push(child);
                    }
                }
            } else {
                // Add all root comments (deleted and non-deleted)
                const rootComment = commentMap.get(comment.id);
                if (rootComment) {
                    rootComments.push(rootComment);
                }
            }
        });

        // Sort with deleted comments at bottom of each thread level
        function sortTree(nodes: CommentWithSeed[]) {
            nodes.sort((a, b) => {
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
        }
        sortTree(rootComments);

        return NextResponse.json(rootComments);
    } catch (error) {
        console.error("Error in comments list API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


