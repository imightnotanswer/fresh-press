import { NextRequest, NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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

        const { data, error } = await supabase
            .from("comments")
            .select("*")
            .eq("post_type", postType)
            .eq("post_id", postId)
            .eq("deleted", false)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching comments:", error);
            return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
        }

        // Fetch vote scores
        const { data: voteRows } = await supabase
            .from('comment_votes')
            .select('comment_id, value');
        const scoreById: Record<string, number> = {};
        (voteRows || []).forEach((v: any) => {
            scoreById[v.comment_id] = (scoreById[v.comment_id] || 0) + (Number(v.value) || 0);
        });

        // Current user's votes to hydrate highlight
        const myVoteById: Record<string, number> = {};
        if (session?.user?.id && data?.length) {
            const { data: myVotes } = await supabase
                .from('comment_votes')
                .select('comment_id, value')
                .eq('user_id', session.user.id);
            (myVotes || []).forEach((v: any) => { myVoteById[v.comment_id] = Number(v.value) || 0; });
        }

        // Fetch avatars/colors for authors
        const userIds = (data || []).map((c: any) => c.user_id);
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, avatar_url, avatar_color')
            .in('id', userIds.length ? userIds : ['-']);
        const avatarById: Record<string, { url: string | null, color: string | null }> = {};
        (profiles || []).forEach((p: any) => { avatarById[p.id] = { url: p.avatar_url || null, color: p.avatar_color || null }; });

        // Build nested tree structure
        const commentMap = new Map<string, any>();
        const rootComments: any[] = [];

        // First pass: create map of all comments
        data?.forEach((comment) => {
            const av = avatarById[comment.user_id] || { url: null, color: null };
            commentMap.set(comment.id, { ...comment, avatar_url: av.url, avatar_color: av.color, score: scoreById[comment.id] || 0, user_vote: myVoteById[comment.id] || 0, children: [] });
        });

        // Second pass: build tree structure
        data?.forEach((comment) => {
            if (comment.parent_id) {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.children.push(commentMap.get(comment.id));
                }
            } else {
                rootComments.push(commentMap.get(comment.id));
            }
        });

        // Sort by score desc, then created_at asc at each level
        function sortTree(nodes: any[]) {
            nodes.sort((a, b) => (b.score - a.score) || (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
            nodes.forEach((n) => sortTree(n.children));
        }
        sortTree(rootComments);

        return NextResponse.json(rootComments);
    } catch (error) {
        console.error("Error in comments list API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


