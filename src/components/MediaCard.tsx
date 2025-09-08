"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Play } from "lucide-react";
import VideoPlayer from "./VideoPlayer";
import { getYouTubeThumbnail, isYouTubeUrl, isVimeoUrl, getVimeoThumbnail } from "@/lib/youtube";

interface MediaCardProps {
    media: {
        _id: string;
        title: string;
        slug: { current: string };
        publishedAt: string;
        artist: {
            name: string;
            slug: { current: string };
        };
        coverUrl?: string;
        videoUrl?: string;
        description?: string;
    };
}

export default function MediaCard({ media }: MediaCardProps) {
    // Get thumbnail URL based on video type
    const getThumbnailUrl = () => {
        if (media.coverUrl) {
            // Use uploaded cover image if available
            return media.coverUrl;
        }
        
        if (media.videoUrl) {
            if (isYouTubeUrl(media.videoUrl)) {
                // Use YouTube thumbnail
                return getYouTubeThumbnail(media.videoUrl, 'high');
            } else if (isVimeoUrl(media.videoUrl)) {
                // Use Vimeo thumbnail
                return getVimeoThumbnail(media.videoUrl);
            }
        }
        
        return null;
    };

    const thumbnailUrl = getThumbnailUrl();
    const hasVideo = !!media.videoUrl;

    return (
        <div className="cutting-edge-card">
            <Link href={`/media/${media.slug.current}`}>
                <div className="aspect-video relative bg-gray-100 group overflow-hidden">
                    {thumbnailUrl ? (
                        <Image
                            src={thumbnailUrl}
                            alt={media.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-16 h-16 bg-black bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                                <Play className="w-8 h-8 text-black ml-1" />
                            </div>
                        </div>
                    )}
                    {/* Play overlay for video thumbnails */}
                    {hasVideo && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <Play className="w-8 h-8 text-black ml-1" />
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <div className="space-y-3">
                        <h3 className="cutting-edge-title line-clamp-2">{media.title}</h3>
                        <p className="cutting-edge-artist">{media.artist.name}</p>
                        {media.description && (
                            <p className="cutting-edge-blurb line-clamp-3">{media.description}</p>
                        )}
                        <p className="cutting-edge-date">
                            {new Date(media.publishedAt).toLocaleDateString('en-US', {
                                month: 'numeric',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </Link>
        </div>
    );
}

