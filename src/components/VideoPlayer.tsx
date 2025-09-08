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
    console.log('VideoPlayer props:', { url, width, height, controls });

    return (
        <div className="relative aspect-video">
            <ReactPlayerDynamic
                url={url}
                width={width}
                height={height}
                controls={controls}
                onReady={() => console.log('ReactPlayer ready')}
                onError={(error) => console.error('ReactPlayer error:', error)}
                onStart={() => console.log('Video started')}
                config={{ 
                    youtube: {
                        modestbranding: 1,
                        rel: 0
                    },
                    vimeo: { 
                        responsive: true 
                    } 
                }}
            />
        </div>
    );
}
