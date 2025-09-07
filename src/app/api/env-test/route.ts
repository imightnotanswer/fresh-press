// src/app/api/env-test/route.ts
import { NextResponse } from "next/server";

function mask(v?: string) {
    if (!v) return null;
    return `${v.length} chars`;
}

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
    const ref = url?.match(/^https?:\/\/([^.]+)\.supabase\.co/i)?.[1] || null;

    return NextResponse.json({
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd(),

        // Supabase
        supabase: {
            url,
            projectRef: ref,
            anonKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
            serviceRolePresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
            anonKeyLen: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined),
            serviceKeyLen: mask(process.env.SUPABASE_SERVICE_ROLE_KEY || undefined),
        },

        // Sanity (optional but handy)
        sanity: {
            projectIdPublic: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || null,
            datasetPublic: process.env.NEXT_PUBLIC_SANITY_DATASET || null,
            projectIdServer: process.env.SANITY_PROJECT_ID || null,
            datasetServer: process.env.SANITY_DATASET || null,
            apiVersion: process.env.SANITY_API_VERSION || null,
        },

        // Which NEXT_PUBLIC keys are visible at runtime
        publicKeys: Object.keys(process.env).filter(k => k.startsWith("NEXT_PUBLIC_")),
    });
}

