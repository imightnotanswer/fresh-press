import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!supabase) {
            return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        }

        const { commentId, value } = await request.json();
        if (!commentId || ![-1, 0, 1].includes(Number(value))) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Set/toggle the vote via RPC (idempotent)
        // Try RPC first
        const rpc = await supabase.rpc("set_comment_vote_with_user", {
            p_comment_id: commentId,
            p_user_id: session.user.id,
            p_value: Number(value),
        });
        if ((rpc as any)?.error) {
            console.warn("set_comment_vote_with_user RPC unavailable, falling back to manual upsert", (rpc as any).error);
            // Fallback manual upsert (idempotent)
            const { data: existing } = await supabase
                .from('comment_votes')
                .select('value')
                .eq('comment_id', commentId)
                .eq('user_id', session.user.id)
                .maybeSingle();
            if (Number(value) === 0) {
                await supabase
                    .from('comment_votes')
                    .delete()
                    .eq('comment_id', commentId)
                    .eq('user_id', session.user.id);
            } else if (existing) {
                await supabase
                    .from('comment_votes')
                    .update({ value: Number(value) })
                    .eq('comment_id', commentId)
                    .eq('user_id', session.user.id);
            } else {
                await supabase
                    .from('comment_votes')
                    .insert({ comment_id: commentId, user_id: session.user.id, value: Number(value) });
            }
        }

        // Return the latest score/counts for this comment for deterministic UI state
        const { data: scoreRow, error: scoreErr } = await supabase
            .from("comment_scores")
            .select("up_count, down_count, score")
            .eq("comment_id", commentId)
            .maybeSingle();
        if (scoreErr) {
            console.error("read comment_scores error", scoreErr);
        }

        return NextResponse.json({
            success: true,
            score: scoreRow?.score ?? 0,
            up_count: scoreRow?.up_count ?? 0,
            down_count: scoreRow?.down_count ?? 0,
            my_vote: Number(value),
        });
    } catch (e) {
        console.error("vote api error", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// End of file
