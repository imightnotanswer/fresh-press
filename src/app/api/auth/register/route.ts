import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        const { email, password, name } = await request.json();
        if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // Normalize
        const normalizedEmail = String(email).toLowerCase();

        // Check if user exists
        const { data: existing } = await supabase
            .schema("next_auth")
            .from("users")
            .select("id")
            .eq("email", normalizedEmail)
            .single();
        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        // Create user in next_auth.users (generate id client-side to avoid missing DB defaults)
        const newUserId = (globalThis as any).crypto?.randomUUID?.() || randomUUID();
        const { data: user, error: createErr } = await supabase
            .schema("next_auth")
            .from("users")
            .insert({ id: newUserId, email: normalizedEmail, name })
            .select("id, email, name")
            .single();
        if (createErr || !user) {
            console.error("Register: failed to create user", createErr);
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }

        // Store password hash in user_credentials
        const passwordHash = await bcrypt.hash(password, 12);
        const { error: credErr } = await supabase
            .schema("next_auth")
            .from("user_credentials")
            .insert({ user_id: user.id, password_hash: passwordHash });
        if (credErr) {
            console.error("Register: failed to set credentials", credErr);
            return NextResponse.json({ error: "Failed to set credentials" }, { status: 500 });
        }

        // Ensure public.user_profiles exists
        try {
            await supabase
                .from("user_profiles")
                .upsert({
                    id: user.id,
                    username: normalizedEmail.split("@")[0],
                    display_name: name || normalizedEmail.split("@")[0],
                    is_public: true,
                    updated_at: new Date().toISOString(),
                }, { onConflict: "id" });
        } catch (e) {
            console.warn("Register: profile upsert failed (non-fatal)", e);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in register API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


