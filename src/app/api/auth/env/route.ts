import { NextResponse } from "next/server";

export async function GET() {
    const resendKey = process.env.RESEND_API_KEY || "";
    const emailFrom = process.env.EMAIL_FROM || "";
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const githubId = process.env.GITHUB_ID || "";
    const githubSecret = process.env.GITHUB_SECRET || "";
    const nextauthUrl = process.env.NEXTAUTH_URL || "";
    const nextauthSecret = process.env.NEXTAUTH_SECRET || "";

    return NextResponse.json({
        nodeEnv: process.env.NODE_ENV,
        nextauthUrlPresent: !!nextauthUrl,
        nextauthSecretPresent: !!nextauthSecret,
        hasResendKey: !!resendKey,
        resendLooksValid: resendKey.startsWith("re_"),
        emailFromPresent: !!emailFrom,
        supabaseUrlPresent: !!supabaseUrl,
        serviceRolePresent: !!serviceRole,
        githubConfigured: !!(githubId && githubSecret),
    });
}


