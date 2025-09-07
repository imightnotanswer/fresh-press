import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function GET() {
    try {
        // Check if user_profiles table exists and get its structure
        const { data: userProfiles, error: userProfilesError } = await supabase
            .from("user_profiles")
            .select("*")
            .limit(1);

        // Check if likes table exists and get its structure
        const { data: likes, error: likesError } = await supabase
            .from("likes")
            .select("*")
            .limit(1);

        // Check if comments table exists and get its structure
        const { data: comments, error: commentsError } = await supabase
            .from("comments")
            .select("*")
            .limit(1);

        return NextResponse.json({
            user_profiles: {
                exists: !userProfilesError,
                error: userProfilesError?.message,
                sample_data: userProfiles
            },
            likes: {
                exists: !likesError,
                error: likesError?.message,
                sample_data: likes
            },
            comments: {
                exists: !commentsError,
                error: commentsError?.message,
                sample_data: comments
            }
        });
    } catch (error) {
        console.error("Error checking tables:", error);
        return NextResponse.json({ error: "Failed to check tables" }, { status: 500 });
    }
}
