"use client";

import dynamic from "next/dynamic";
import { getYouTubeId, isYouTubeUrl } from "@/lib/youtube";

const ReactPlayerDynamic = dynamic(() => import("react-player"), {
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

    return (
        <div className="relative aspect-video">
            <ReactPlayerDynamic
                // @ts-expect-error - ReactPlayer dynamic import typing issue
                url={normalizedUrl}
                width={width}
                height={height}
                controls={controls}
                onReady={() => console.log('ReactPlayer ready')}
                onError={(error) => console.error('ReactPlayer error:', error)}
                onStart={() => console.log('Video started')}
            />
        </div>
    );
}
