import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        return NextResponse.json({
            session: session,
            hasSession: !!session,
            providers: authOptions.providers?.map(p => p.name) || [],
            supabaseConfigured: !!process.env.SUPABASE_URL,
            nextAuthUrl: process.env.NEXTAUTH_URL
        });
    } catch (error) {
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
}
