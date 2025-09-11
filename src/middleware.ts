import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiting (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20, // 20 requests per window (increased for development)
    maxRegistrations: 5, // 5 registrations per window (increased for development)
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
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const pathname = request.nextUrl.pathname

    // Debug endpoint to clear rate limits (development only)
    if (pathname === '/api/debug/clear-rate-limits') {
        rateLimitMap.clear()
        return new NextResponse(
            JSON.stringify({ message: 'Rate limits cleared' }), 
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }

    // Rate limit auth endpoints
    if (pathname.startsWith('/api/auth/')) {
        if (isRateLimited(ip, 'auth')) {
            return new NextResponse(
                JSON.stringify({ error: 'Too Many Requests' }),
                {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }
    }

    // Rate limit registration specifically
    if (pathname === '/api/auth/signup' || pathname === '/api/auth/register') {
        if (isRateLimited(ip, 'register')) {
            return new NextResponse(
                JSON.stringify({ error: 'Too Many Registration Attempts' }),
                {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/api/auth/:path*',
        '/api/signup/:path*',
        '/api/register/:path*',
        '/api/debug/:path*'
    ]
}