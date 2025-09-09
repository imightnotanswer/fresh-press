import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });
        const { token, email, newPassword } = await request.json();
        if (!token || !email || !newPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const normalized = String(email).toLowerCase();

        // Look up token
        const { data: vt, error: vtErr } = await supabase
            .schema("next_auth")
            .from("verification_tokens")
            .select("identifier, token, expires")
            .eq("identifier", normalized)
            .eq("token", token)
            .single();
        if (vtErr || !vt) return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });

        if (new Date(vt.expires).getTime() < Date.now()) {
            // Expired
            return NextResponse.json({ error: "Link expired" }, { status: 400 });
        }

        // Set credentials
        const { data: user } = await supabase
            .schema("next_auth")
            .from("users")
            .select("id")
            .eq("email", normalized)
            .single();
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 400 });

        const hash = await bcrypt.hash(newPassword, 12);

        // Upsert into user_credentials
        const { error: credErr } = await supabase
            .schema("next_auth")
            .from("user_credentials")
            .upsert({ user_id: user.id, password_hash: hash }, { onConflict: "user_id" });
        if (credErr) return NextResponse.json({ error: "Failed to set password" }, { status: 500 });

        // Invalidate the token immediately
        await supabase
            .schema("next_auth")
            .from("verification_tokens")
            .delete()
            .eq("identifier", normalized)
            .eq("token", token);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("verify-password-reset error", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
