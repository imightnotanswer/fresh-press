import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer as supabase } from "@/lib/supabase-server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    try {
        if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 503 });
        const { email } = await request.json();
        if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

        const normalized = String(email).toLowerCase();
        const { data: user } = await supabase
            .schema("next_auth")
            .from("users")
            .select("id")
            .eq("email", normalized)
            .single();

        // Always return success to avoid account enumeration
        const okResponse = NextResponse.json({ success: true });
        if (!user) return okResponse;

        // Generate token and store in next_auth.verification_tokens
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 1000 * 60 * 15).toISOString(); // 15 minutes

        await supabase
            .schema("next_auth")
            .from("verification_tokens")
            .insert({ identifier: normalized, token, expires });

        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const link = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalized)}`;

        // Send email via SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: normalized,
            subject: "Reset your Fresh Press password",
            html: `Click the link to reset your password: <a href="${link}">${link}</a> (valid 15 minutes)`,
        });

        return okResponse;
    } catch (e) {
        console.error("request-password-reset error", e);
        return NextResponse.json({ success: true }); // avoid leaking
    }
}



