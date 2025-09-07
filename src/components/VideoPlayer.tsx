"use client";

import dynamic from "next/dynamic";

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
    return (
        <div className="relative aspect-video">
            {/* @ts-expect-error - ReactPlayer dynamic import typing issue */}
            <ReactPlayerDynamic
                url={url}
                width={width}
                height={height}
                controls={controls}
                // keep Vimeo config if you use it; YouTube params go in the URL
                config={{ vimeo: { responsive: true } }}
            />
        </div>
    );
}
