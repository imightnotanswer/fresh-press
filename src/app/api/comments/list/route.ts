import { NextRequest, NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: "Comments system not configured" }, { status: 503 });
        }

        const { searchParams } = new URL(request.url);
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

        // Build nested tree structure
        const commentMap = new Map();
        const rootComments: any[] = [];

        // First pass: create map of all comments
        data?.forEach((comment) => {
            commentMap.set(comment.id, { ...comment, children: [] });
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

        return NextResponse.json(rootComments);
    } catch (error) {
        console.error("Error in comments list API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


