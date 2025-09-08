import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { supabaseServer as supabase } from "./supabase-server";

// Initialize Resend only if a likely-valid API key is present (Resend keys start with "re_")
const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey && resendKey.startsWith("re_") ? new Resend(resendKey) : null;

// Only initialize Supabase adapter if environment variables are available
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAdapter = SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? (SupabaseAdapter as unknown as (
        args: { url: string; secret: string; schema?: string }
    ) => any)({
        url: SUPABASE_URL,
        secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
        schema: "public",
    })
    : undefined;

// Build providers list conditionally to avoid runtime errors when some envs are missing
const providers: NextAuthOptions["providers"] = [];
const isProduction = process.env.NODE_ENV === "production";
const hasCustomSmtp = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);
const enableEmailProvider = (!!resend || hasCustomSmtp || !isProduction) && !!supabaseAdapter; // require adapter

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
    providers.push(
        GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
        })
    );
}

if (enableEmailProvider) {
    if (resend) {
        providers.push(
            EmailProvider({
                server: {
                    host: "smtp.resend.com",
                    port: 587,
                    auth: {
                        user: "resend",
                        pass: process.env.RESEND_API_KEY || "",
                    },
                },
                from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                sendVerificationRequest: async ({ identifier: email, url, provider }) => {
                    try {
                        await resend!.emails.send({
                            from: provider.from!,
                            to: email,
                            subject: "Sign in to Fresh Press",
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h1 style="color: #333;">Welcome to Fresh Press</h1>
                                    <p>Click the button below to sign in to your account:</p>
                                    <a href="${url}" style="display: inline-block; background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">
                                        Sign In to Fresh Press
                                    </a>
                                    <p style="color: #666; font-size: 14px;">
                                        If the button doesn't work, copy and paste this link into your browser:<br>
                                        <a href="${url}">${url}</a>
                                    </p>
                                    <p style="color: #666; font-size: 12px;">
                                        This link will expire in 24 hours.
                                    </p>
                                </div>
                            `,
                        });
                    } catch (error) {
                        console.warn("Resend failed to send verification email:", error);
                        console.log("Email verification URL:", url);
                    }
                },
            })
        );
    } else if (hasCustomSmtp) {
        // Use custom SMTP server (e.g., Gmail). Let NextAuth send via nodemailer.
        providers.push(
            EmailProvider({
                server: {
                    host: process.env.SMTP_HOST!,
                    port: Number(process.env.SMTP_PORT || 587),
                    auth: {
                        user: process.env.SMTP_USER!,
                        pass: process.env.SMTP_PASS!,
                    },
                },
                from: process.env.EMAIL_FROM || process.env.SMTP_USER!,
            })
        );
    } else if (!isProduction) {
        // Dev fallback: no email will be sent; URL will be logged by NextAuth
        providers.push(
            EmailProvider({
                server: {
                    host: "smtp.resend.com",
                    port: 587,
                    auth: { user: "resend", pass: "" },
                },
                from: "onboarding@resend.dev",
            })
        );
    }
}

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    ...(supabaseAdapter && { adapter: supabaseAdapter }),
    providers,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
};
