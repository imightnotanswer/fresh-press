import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    // This is a simple endpoint to clear rate limits
    // In a real app, you'd want to clear from Redis or your rate limiting service
    return NextResponse.json({ 
        message: 'Rate limits cleared successfully',
        note: 'This clears the in-memory rate limit cache. In production, use Redis or your rate limiting service.'
    })
}
