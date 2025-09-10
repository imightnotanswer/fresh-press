import { NextRequest, NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
        if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

        const normalized = String(email).toLowerCase();
        const { data, error } = await supabase
            .schema("next_auth")
            .from("users")
            .select("id")
            .eq("email", normalized)
            .maybeSingle();

        if (error) {
            console.error("user-exists check error", error);
            return NextResponse.json({ error: "Failed to check user" }, { status: 500 });
        }

        return NextResponse.json({ exists: !!data });
    } catch (e) {
        console.error("user-exists exception", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}



