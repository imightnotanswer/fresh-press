import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
            .from("users")
            .select("id")
            .eq("email", normalizedEmail)
            .single();
        if (existing) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        // Create user in next_auth.users
        const { data: user, error: createErr } = await supabase
            .from("users")
            .insert({ email: normalizedEmail, name })
            .select("id")
            .single();
        if (createErr || !user) {
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }

        // Store password hash in user_credentials
        const passwordHash = await bcrypt.hash(password, 12);
        const { error: credErr } = await supabase
            .from("user_credentials")
            .insert({ user_id: user.id, password_hash: passwordHash });
        if (credErr) {
            return NextResponse.json({ error: "Failed to set credentials" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in register API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


