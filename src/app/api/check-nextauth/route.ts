import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function GET() {
    try {
        if (!supabase) {
            return NextResponse.json({ error: "Database not configured" }, { status: 503 });
        }

        const results: Record<string, { exists: boolean; error?: string | null }> = {};

        const tables = [
            "users",
            "accounts",
            "sessions",
            "verification_tokens",
        ];

        for (const table of tables) {
            const { error } = await supabase.from(table).select("*").limit(1);
            results[table] = { exists: !error, error: error?.message ?? null };
        }

        return NextResponse.json({ tables: results });
    } catch (error) {
        console.error("Error checking NextAuth tables:", error);
        return NextResponse.json({ error: "Failed to check NextAuth tables" }, { status: 500 });
    }
}


