import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
    try {
        if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type") || "media";
        const idsParam = searchParams.get("ids") || ""; // comma separated uuids
        const ids = idsParam
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        if (!ids.length) return NextResponse.json({ counts: [], liked: [] });

        // counts from denormalized table, with safe fallback
        let countRows: { post_id: string; like_count: number }[] = [];
        {
            const { data, error } = await supabase
                .from("post_like_counts")
                .select("post_id, like_count")
                .in("post_id", ids as any)
                .eq("post_type", type);
            if (error) {
                console.warn("post_like_counts unavailable; falling back to base likes", error);
            } else {
                countRows = data || [];
            }
        }
        if (!countRows.length) {
            const { data: rawCounts, error } = await supabase
                .from("likes")
                .select("post_id")
                .eq("post_type", type)
                .in("post_id", ids as any);
            if (!error && rawCounts) {
                const map: Record<string, number> = {};
                rawCounts.forEach((r: any) => { map[r.post_id] = (map[r.post_id] || 0) + 1; });
                countRows = Object.entries(map).map(([post_id, like_count]) => ({ post_id, like_count } as any));
            }
        }

        // liked-by-me
        let likedRows: { post_id: string }[] = [];
        if (session?.user?.id) {
            const { data: likedData, error: likedErr } = await supabase
                .from("likes")
                .select("post_id")
                .eq("user_id", session.user.id)
                .eq("post_type", type)
                .in("post_id", ids as any);
            if (likedErr) {
                console.error("batch liked error", likedErr);
            } else {
                likedRows = likedData || [];
            }
        }

        return NextResponse.json({ counts: countRows || [], liked: likedRows });
    } catch (e) {
        console.error("batch error", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


