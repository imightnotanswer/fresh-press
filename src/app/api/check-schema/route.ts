import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        }

        // Get table schemas using information_schema
        const { data: tableInfo, error } = await supabase
            .rpc('get_table_columns', {
                table_name: 'user_profiles'
            });

        if (error) {
            // Fallback: try to describe tables by attempting to insert and see what columns are expected
            const { data: userProfilesTest, error: userProfilesError } = await supabase
                .from("user_profiles")
                .select("*")
                .limit(0);

            const { data: likesTest, error: likesError } = await supabase
                .from("likes")
                .select("*")
                .limit(0);

            const { data: commentsTest, error: commentsError } = await supabase
                .from("comments")
                .select("*")
                .limit(0);

            return NextResponse.json({
                message: "Tables exist but can't get detailed schema",
                user_profiles: {
                    exists: !userProfilesError,
                    error: userProfilesError?.message
                },
                likes: {
                    exists: !likesError,
                    error: likesError?.message
                },
                comments: {
                    exists: !commentsError,
                    error: commentsError?.message
                }
            });
        }

        return NextResponse.json({ tableInfo });
    } catch (error) {
        console.error("Error checking schema:", error);
        return NextResponse.json({ error: "Failed to check schema" }, { status: 500 });
    }
}
