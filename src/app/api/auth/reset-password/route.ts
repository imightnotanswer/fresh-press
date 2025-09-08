import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });
        const { email, newPassword } = await request.json();
        if (!email || !newPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const { data: user, error } = await supabase
            .schema("next_auth")
            .from("users")
            .select("id")
            .eq("email", String(email).toLowerCase())
            .single();
        if (error || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const hash = await bcrypt.hash(newPassword, 12);
        const { error: upErr } = await supabase
            .schema("next_auth")
            .from("user_credentials")
            .upsert({ user_id: user.id, password_hash: hash });
        if (upErr) return NextResponse.json({ error: "Failed to update password" }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("reset-password error", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


