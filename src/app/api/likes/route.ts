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

        const { postId, postType } = await request.json();
        if (!postId || !postType) {
            return NextResponse.json({ error: "Missing postId or postType" }, { status: 400 });
        }

        // Check if like already exists
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

        // Add like
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
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const postId = searchParams.get("postId");
        const postType = searchParams.get("postType");

        if (postId && postType) {
            // Check if user has liked this specific post
            const { data, error } = await supabase
                .from("likes")
                .select("id")
                .eq("user_id", session.user.id)
                .eq("post_id", postId)
                .eq("post_type", postType)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Error checking like:", error);
                return NextResponse.json({ error: "Failed to check like" }, { status: 500 });
            }

            return NextResponse.json({ liked: !!data });
        } else {
            // Get all user's liked posts
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
        }
    } catch (error) {
        console.error("Error in likes GET API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
