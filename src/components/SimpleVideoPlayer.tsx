"use client";

import { useEffect, useState } from "react";

type Props = {
    url: string;
    width?: string | number;
    height?: string | number;
    controls?: boolean;
};

export default function SimpleVideoPlayer({
    url,
    width = "100%",
    height = "100%",
    controls = true,
}: Props) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('SimpleVideoPlayer mounted with URL:', url);
        setIsLoaded(false);
        setError(null);
    }, [url]);

    const handleLoad = () => {
        console.log('Video loaded successfully');
        setIsLoaded(true);
    };

    const handleError = (e: any) => {
        console.error('Video error:', e);
        setError('Failed to load video');
    };

    if (error) {
        return (
            <div className="aspect-video bg-gray-200 flex items-center justify-center rounded">
                <div className="text-center">
                    <p className="text-red-600 mb-2">Video failed to load</p>
                    <p className="text-sm text-gray-600">URL: {url}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative aspect-video">
            <iframe
                src={url}
                width={width}
                height={height}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleLoad}
                onError={handleError}
                className="w-full h-full rounded"
            />
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <p>Loading video...</p>
                </div>
            )}
        </div>
    );
}




