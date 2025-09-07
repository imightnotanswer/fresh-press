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
            <ReactPlayerDynamic
                // @ts-expect-error - ReactPlayer dynamic import typing issue
                url={url}
                width={width}
                height={height}
                controls={controls}
                config={{ vimeo: { responsive: true } }}
            />
        </div>
    );
}
