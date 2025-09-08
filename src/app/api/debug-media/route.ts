import { NextResponse } from "next/server";
import { sanity } from "@/lib/sanity";
import { ALL_MEDIA } from "@/lib/groq";

export async function GET() {
    try {
        if (!sanity) {
            return NextResponse.json({ error: "Sanity client not configured" }, { status: 500 });
        }

        const media = await sanity.fetch(ALL_MEDIA);

        return NextResponse.json({
            count: media?.length || 0,
            media: media || [],
            sample: media?.[0] || null
        });
    } catch (error) {
        console.error("Error fetching media:", error);
        return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
    }
}



