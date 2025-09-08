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

        const { postId, postType } = await request.json();
        if (!postId || !postType) {
            return NextResponse.json({ error: "Missing postId or postType" }, { status: 400 });
        }

        // Prevent duplicate likes by same user
        const { data: existingLike } = await supabase
            .from("likes")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("post_id", postId)
            .eq("post_type", postType)
            .single();

        if (existingLike) {
            return NextResponse.json({ error: "Already liked" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("likes")
            .insert({
                user_id: session.user.id,
                post_id: postId,
                post_type: postType,
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding like:", error);
            return NextResponse.json({ error: "Failed to add like" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in likes POST API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!supabase) {
            return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        }

        const { searchParams } = new URL(request.url);
        const postId = searchParams.get("postId");
        const postType = searchParams.get("postType");

        if (!postId || !postType) {
            return NextResponse.json({ error: "Missing postId or postType" }, { status: 400 });
        }

        const { error } = await supabase
            .from("likes")
            .delete()
            .eq("user_id", session.user.id)
            .eq("post_id", postId)
            .eq("post_type", postType);

        if (error) {
            console.error("Error removing like:", error);
            return NextResponse.json({ error: "Failed to remove like" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in likes DELETE API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        }

        const { searchParams } = new URL(request.url);
        const postId = searchParams.get("postId");
        const postType = searchParams.get("postType");
        const countOnly = searchParams.get("count");

        if (countOnly && postId && postType) {
            const { count, error } = await supabase
                .from("likes")
                .select("id", { count: "exact", head: true })
                .eq("post_id", postId)
                .eq("post_type", postType);

            if (error) {
                console.error("Error counting likes:", error);
                return NextResponse.json({ error: "Failed to count likes" }, { status: 500 });
            }

            return NextResponse.json({ count: count ?? 0 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (postId && postType) {
            const { data, error } = await supabase
                .from("likes")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("post_id", postId)
                .eq("post_type", postType)
                .single();

            if (error && (error as any).code !== 'PGRST116') {
                console.error("Error checking like:", error);
                return NextResponse.json({ error: "Failed to check like" }, { status: 500 });
            }

            return NextResponse.json({ liked: !!data });
        }

        // Get all likes for current user
        const { data, error } = await supabase
            .from("likes")
            .select("post_id, post_type, created_at")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching likes:", error);
            return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in likes GET API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


