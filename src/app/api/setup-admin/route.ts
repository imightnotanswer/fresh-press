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

        // Check if there are any existing admins
        const { data: existingAdmins, error: adminError } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("is_admin", true);

        if (adminError) {
            console.error("Error checking existing admins:", adminError);
            return NextResponse.json({ error: "Failed to check existing admins" }, { status: 500 });
        }

        // If there are existing admins, deny access
        if (existingAdmins && existingAdmins.length > 0) {
            return NextResponse.json({
                error: "Admin already exists. Contact an existing admin to promote you."
            }, { status: 403 });
        }

        // Make the current user an admin
        const { error: promoteError } = await supabase
            .from("user_profiles")
            .upsert({
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'admin',
                display_name: session.user.name || session.user.email?.split('@')[0] || 'Admin',
                bio: 'Site Administrator',
                avatar_url: session.user.image,
                is_public: true,
                is_admin: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (promoteError) {
            console.error("Error promoting user to admin:", promoteError);
            return NextResponse.json({ error: "Failed to promote user to admin" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "You have been promoted to admin! Refresh the page to see admin features."
        });
    } catch (error) {
        console.error("Error in setup admin API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
