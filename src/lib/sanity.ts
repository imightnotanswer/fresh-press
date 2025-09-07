// src/lib/sanity.ts
import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

// Prefer public var for client components; fall back to private; default to a fixed date.
const rawApi =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION ??
    process.env.SANITY_API_VERSION ??
    "2024-08-01";

// Strip BOM and whitespace just in case
const apiVersion = rawApi.replace(/^\uFEFF/, "").trim();

// Validate: must be "1" or YYYY-MM-DD
if (!/^1$|^\d{4}-\d{2}-\d{2}$/.test(apiVersion)) {
    throw new Error(
        `Invalid SANITY_API_VERSION: "${rawApi}" -> "${apiVersion}". Expected "1" or "YYYY-MM-DD".`
    );
}

const isServer = typeof window === "undefined";

// Only create Sanity client if environment variables are available
export const sanity = projectId && dataset ? createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: !isServer, // use CDN in browser, uncached on server
    // Never send your read token to the browser:
    token: isServer ? process.env.SANITY_READ_TOKEN : undefined,
}) : null;
