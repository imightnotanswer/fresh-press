import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
        schema: "next_auth",
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

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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

// Credentials provider (username/email + password)
if (supabaseAdapter) {
    providers.push(
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                const email = credentials?.email?.toLowerCase();
                const password = credentials?.password || "";
                if (!email || !password) return null;

                // Look up user by email from next_auth.users
                if (!supabase) return null;
                const { data: user, error } = await supabase
                    .schema("next_auth")
                    .from("users")
                    .select("id, email, name")
                    .eq("email", email)
                    .single();
                if (error || !user) return null;

                // Fetch password hash from our credential table
                const { data: cred } = await supabase
                    .schema("next_auth")
                    .from("user_credentials")
                    .select("password_hash")
                    .eq("user_id", user.id)
                    .single();
                if (!cred?.password_hash) return null;

                const ok = await bcrypt.compare(password, cred.password_hash as string);
                if (!ok) return null;

                return { id: String(user.id), email: user.email, name: user.name } as any;
            },
        })
    );
}

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    ...(supabaseAdapter && { adapter: supabaseAdapter }),
    providers,
    pages: {
        signIn: "/signin",
        error: "/signin",
    },
    debug: process.env.NODE_ENV !== "production",
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account }) {
            try {
                // Disallow creating new accounts via magic email links.
                // Only users that already exist may use email sign-in.
                if (account?.provider === "email") {
                    const email = (user as any)?.email?.toLowerCase?.();
                    if (!email || !supabase) return false;
                    const { data } = await supabase
                        .schema("next_auth")
                        .from("users")
                        .select("id")
                        .eq("email", email)
                        .maybeSingle();
                    if (!data) {
                        // Block sign-in; they must register via the signup form.
                        return false;
                    }
                }
                return true;
            } catch {
                return false;
            }
        },
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
            // Hydrate frequently used profile fields for faster client-side access
            try {
                if (supabase && session?.user?.id) {
                    const { data } = await supabase
                        .from('user_profiles')
                        .select('username, avatar_color, avatar_url, is_admin')
                        .eq('id', session.user.id)
                        .single();
                    if (data) {
                        (session.user as any).username = data.username ?? null;
                        (session.user as any).avatar_color = data.avatar_color ?? null;
                        (session.user as any).avatar_url = data.avatar_url ?? null;
                        (session.user as any).is_admin = data.is_admin ?? false;
                    }
                }
            } catch { }
            return session;
        },
    },
    events: {
        // Create a user_profile row the first time a user is created
        async createUser(message) {
            try {
                if (!supabase) return;
                const { id, email, name, image } = message.user as any;
                await supabase
                    .from("user_profiles")
                    .upsert({
                        id,
                        username: (email || "").split("@")[0],
                        display_name: name || (email || "").split("@")[0],
                        avatar_url: image || null,
                        is_public: true,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "id" });
            } catch (e) {
                console.warn("createUser event: failed to upsert user_profiles", e);
            }
        },
        // Also ensure profile exists on login (covers existing users)
        async signIn(message) {
            try {
                if (!supabase) return true;
                const user = (message as any).user;
                if (!user?.id) return true;
                await supabase
                    .from("user_profiles")
                    .upsert({
                        id: user.id,
                        username: (user.email || "").split("@")[0],
                        display_name: user.name || (user.email || "").split("@")[0],
                        avatar_url: user.image || null,
                        is_public: true,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "id" });
                return true;
            } catch (e) {
                console.warn("signIn event: failed to upsert user_profiles", e);
                return true;
            }
        },
    },
};
