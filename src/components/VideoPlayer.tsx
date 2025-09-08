"use client";

import dynamic from "next/dynamic";
import { getYouTubeId, isYouTubeUrl } from "@/lib/youtube";

const ReactPlayerDynamic = dynamic<any>(() => import("react-player"), {
    ssr: false,
    loading: () => <div className="aspect-video bg-gray-200 animate-pulse rounded" />
});

type Props = {
    url: string;
    width?: string | number;
    height?: string | number;
    controls?: boolean;
};

export default function VideoPlayer({
    url,
    width = "100%",
    height = "100%",
    controls = true,
}: Props) {
    console.log('VideoPlayer props:', { url, width, height, controls });

    // Normalize YouTube URLs (e.g., shorts/live/embed) to a standard watch URL
    const normalizedUrl = (() => {
        try {
            if (isYouTubeUrl(url)) {
                const videoId = getYouTubeId(url);
                if (videoId) {
                    return `https://www.youtube.com/watch?v=${videoId}`;
                }
            }
        } catch (e) {
            // fall through to original url
        }
        return url;
    })();

    // Extract start time from either query (?t=) appended by MediaCard, or standard YouTube params
    const startSeconds = (() => {
        try {
            const u = new URL(normalizedUrl);
            const t = u.searchParams.get('t') || u.searchParams.get('start');
            if (!t) return 0;
            // support formats like "90" or "1m30s"
            if (/^\d+$/.test(t)) return parseInt(t, 10);
            const m = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
            if (!m) return 0;
            const h = parseInt(m[1] || '0', 10);
            const mnt = parseInt(m[2] || '0', 10);
            const s = parseInt(m[3] || '0', 10);
            return h * 3600 + mnt * 60 + s;
        } catch {
            return 0;
        }
    })();

    // If YouTube, prefer using the official embed URL which is very reliable
    const youtubeEmbedUrl = (() => {
        const id = getYouTubeId(normalizedUrl);
        if (!id) return null;
        const params = new URLSearchParams();
        if (startSeconds > 0) params.set('start', String(startSeconds));
        const qs = params.toString();
        return `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : ''}`;
    })();

    return (
        <div className="relative aspect-video">
            {youtubeEmbedUrl ? (
                <iframe
                    src={youtubeEmbedUrl}
                    width={width}
                    height={height}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full rounded"
                    title="YouTube video player"
                />
            ) : (
                <ReactPlayerDynamic
                    url={normalizedUrl}
                    width={width}
                    height={height}
                    controls={controls}
                    config={{ youtube: { playerVars: startSeconds > 0 ? { start: startSeconds } : {} } }}
                    onReady={() => console.log('ReactPlayer ready')}
                    onError={(error: unknown) => console.error('ReactPlayer error:', error)}
                    onStart={() => console.log('Video started')}
                />
            )}
        </div>
    );
}
