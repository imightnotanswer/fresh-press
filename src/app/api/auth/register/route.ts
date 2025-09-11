import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabaseAdmin } from '@/lib/supabase-server';

// Simple in-memory rate limiting (use Redis in production)
const registrationAttempts = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRegistrations: 3, // 3 registrations per IP per window
};

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const current = registrationAttempts.get(ip);

    if (!current || now > current.resetTime) {
        registrationAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
        return false;
    }

    if (current.count >= RATE_LIMIT.maxRegistrations) {
        return true;
    }

    current.count++;
    return false;
}

async function verifyHCaptcha(token: string): Promise<boolean> {
    try {
        const response = await fetch('https://hcaptcha.com/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: process.env.NEXT_PUBLIC_HCAPTCHA_SECRET!,
                response: token,
            }),
        });

        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('hCaptcha verification failed:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get client IP
        const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';

        // Check rate limit
        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: 'Too many registration attempts. Please try again later.' },
                { status: 429 }
            );
        }

        const { email, password, name, hcaptchaToken } = await request.json();

        // Validate input
        if (!email || !password || !hcaptchaToken) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify hCaptcha
        const isCaptchaValid = await verifyHCaptcha(hcaptchaToken);
        if (!isCaptchaValid) {
            return NextResponse.json(
                { error: 'CAPTCHA verification failed' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 409 }
            );
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for now
        });

        if (authError) {
            console.error('Auth creation error:', authError);
            return NextResponse.json(
                { error: 'Failed to create user account' },
                { status: 500 }
            );
        }

        // Create user profile
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                email,
                username: name || email.split('@')[0], // Use provided name or default to email prefix
                created_at: new Date().toISOString(),
            });

        if (profileError) {
            console.error('Profile creation error:', profileError);
            // Clean up auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            return NextResponse.json(
                { error: 'Failed to create user profile' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Account created successfully'
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}