import { NextResponse } from "next/server";
import { getYouTubeId, getYouTubeThumbnail, isYouTubeUrl } from "@/lib/youtube";

export async function GET() {
    const testUrls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://youtube.com/shorts/abc123",
        "https://vimeo.com/123456789",
        "not-a-video-url"
    ];

    const results = testUrls.map(url => ({
        url,
        isYouTube: isYouTubeUrl(url),
        videoId: getYouTubeId(url),
        thumbnail: getYouTubeThumbnail(url, 'high')
    }));

    return NextResponse.json({ results });
}
