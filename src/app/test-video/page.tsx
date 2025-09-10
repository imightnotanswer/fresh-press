"use client";

import VideoPlayer from "@/components/VideoPlayer";

export default function TestVideoPage() {
    const testUrls = [
        "https://www.youtube.com/watch?v=91cs4dzLXe8", // Alex G video
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Test video
        "https://youtu.be/dQw4w9WgXcQ", // Short URL
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <h1 className="text-2xl font-bold mb-8">Video Player Test</h1>
            
            <div className="space-y-8">
                {testUrls.map((url, index) => (
                    <div key={index} className="border p-4 rounded">
                        <h2 className="text-lg font-semibold mb-2">Test {index + 1}</h2>
                        <p className="text-sm text-gray-600 mb-4">URL: {url}</p>
                        <div className="max-w-2xl">
                            <VideoPlayer url={url} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}




