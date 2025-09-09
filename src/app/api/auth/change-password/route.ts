import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

        const { oldPassword, newPassword } = await request.json();
        if (!oldPassword || !newPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const { data: cred } = await supabase
            .schema("next_auth")
            .from("user_credentials")
            .select("password_hash")
            .eq("user_id", session.user.id)
            .single();

        if (!cred?.password_hash) return NextResponse.json({ error: "No password set for this account" }, { status: 400 });

        const ok = await bcrypt.compare(oldPassword, cred.password_hash as string);
        if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

        const hash = await bcrypt.hash(newPassword, 12);
        const { error } = await supabase
            .schema("next_auth")
            .from("user_credentials")
            .update({ password_hash: hash })
            .eq("user_id", session.user.id);

        if (error) return NextResponse.json({ error: "Failed to update password" }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("change-password error", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
