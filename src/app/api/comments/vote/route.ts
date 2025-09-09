import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

        const { commentId, value } = await request.json();
        if (!commentId || ![1, 0, -1].includes(Number(value))) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Check existing vote
        const { data: existing } = await supabase
            .from('comment_votes')
            .select('value')
            .eq('comment_id', commentId)
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (Number(value) === 0) {
            // explicit clear
            await supabase
                .from('comment_votes')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', session.user.id);
        } else if (existing && existing.value === Number(value)) {
            // same vote -> no change
        } else if (existing) {
            // Update
            await supabase
                .from('comment_votes')
                .update({ value: Number(value) })
                .eq('comment_id', commentId)
                .eq('user_id', session.user.id);
        } else {
            // Insert
            await supabase
                .from('comment_votes')
                .insert({ comment_id: commentId, user_id: session.user.id, value: Number(value) });
        }

        // Return new score
        const { data: sumRows } = await supabase
            .from('comment_votes')
            .select('value')
            .eq('comment_id', commentId);
        const score = (sumRows || []).reduce((acc: number, r: any) => acc + (Number(r.value) || 0), 0);

        return NextResponse.json({ success: true, score, userVote: Number(value) });
    } catch (e) {
        console.error('vote error', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


