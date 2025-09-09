import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!supabase) {
            return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        }

        // Check if user is admin
        const { data: profile, error } = await supabase
            .from("user_profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .single();

        // If the profile row doesn't exist or any select error occurs, treat as non-admin
        if (error) {
            console.warn("Admin check: profile not found or error, defaulting to non-admin:", error?.code || error);
            return NextResponse.json({
                isAdmin: false,
                user: {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.name
                }
            });
        }

        return NextResponse.json({
            isAdmin: profile?.is_admin || false,
            user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name
            }
        });
    } catch (error) {
        console.error("Error in admin check API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
