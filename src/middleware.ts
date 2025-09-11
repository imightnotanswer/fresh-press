import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiting (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per window
    maxRegistrations: 3, // 3 registrations per window
}

function getRateLimitKey(ip: string, type: 'auth' | 'register'): string {
    return `${ip}:${type}`
}

function isRateLimited(ip: string, type: 'auth' | 'register'): boolean {
    const key = getRateLimitKey(ip, type)
    const now = Date.now()
    const limit = type === 'register' ? RATE_LIMIT.maxRegistrations : RATE_LIMIT.maxRequests

    const current = rateLimitMap.get(key)

    if (!current || now > current.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs })
        return false
    }

    if (current.count >= limit) {
        return true
    }

    current.count++
    return false
}

export function middleware(request: NextRequest) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
    const pathname = request.nextUrl.pathname

    // Rate limit auth endpoints
    if (pathname.startsWith('/api/auth/')) {
        if (isRateLimited(ip, 'auth')) {
            return new NextResponse('Too Many Requests', { status: 429 })
        }
    }

    // Rate limit registration specifically
    if (pathname === '/api/auth/signup' || pathname === '/api/auth/register') {
        if (isRateLimited(ip, 'register')) {
            return new NextResponse('Too Many Registration Attempts', { status: 429 })
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/api/auth/:path*',
        '/api/signup/:path*',
        '/api/register/:path*'
    ]
}