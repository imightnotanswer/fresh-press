import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const providers = (authOptions.providers as any[])?.map((p) => (p as any).id) || [];
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        const hasAdapter = !!(supabaseUrl && hasServiceRole);
        const hasResend = !!process.env.RESEND_API_KEY;

        return NextResponse.json({
            nodeEnv: process.env.NODE_ENV,
            nextauthUrl: process.env.NEXTAUTH_URL,
            providers,
            hasAdapter,
            hasResend,
            supabaseUrlPresent: !!supabaseUrl,
            hasServiceRole,
        });
    } catch (error) {
        return NextResponse.json({ error: "auth-health failed" }, { status: 500 });
    }
}



