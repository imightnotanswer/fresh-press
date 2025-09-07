import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if current user is already admin
        const { data: currentProfile, error: currentError } = await supabase
            .from("user_profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .single();

        if (currentError || !currentProfile?.is_admin) {
            // If not admin, check if this is the first user (make them admin)
            const { data: userCount, error: countError } = await supabase
                .from("user_profiles")
                .select("id", { count: "exact" });

            if (countError) {
                return NextResponse.json({ error: "Failed to check user count" }, { status: 500 });
            }

            if (userCount && userCount.length > 1) {
                return NextResponse.json({ error: "Only the first user can promote themselves" }, { status: 403 });
            }
        }

        const { email } = await request.json();
        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        // Find user by email
        const { data: user, error: userError } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("id", (await supabase.auth.admin.getUserByEmail(email)).data.user?.id)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Promote user to admin
        const { error: promoteError } = await supabase
            .from("user_profiles")
            .update({ is_admin: true })
            .eq("id", user.id);

        if (promoteError) {
            console.error("Error promoting user:", promoteError);
            return NextResponse.json({ error: "Failed to promote user" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "User promoted to admin" });
    } catch (error) {
        console.error("Error in admin promote API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
