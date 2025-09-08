"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Play } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { getYouTubeThumbnail, isYouTubeUrl, isVimeoUrl, getVimeoThumbnail, getYouTubeId } from "@/lib/youtube";
import { useRouter } from "next/navigation";

const ReactPlayerDynamic = dynamic<any>(() => import("react-player"), { ssr: false });

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
    const router = useRouter();
    const [isPlayingInline, setIsPlayingInline] = useState(false);
    const [playedSeconds, setPlayedSeconds] = useState(0);
    const [inlineError, setInlineError] = useState<string | null>(null);
    const playerRef = useRef<any>(null);

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
    const youTubeId = isYouTubeUrl(media.videoUrl || '') ? getYouTubeId(media.videoUrl || '') : null;
    const inlineUrl = youTubeId ? `https://www.youtube.com/embed/${youTubeId}` : media.videoUrl;

    const handlePlayInline = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!hasVideo) return;
        setIsPlayingInline(true);
    }, [hasVideo]);

    const buildDetailHref = useCallback(() => {
        let time = playedSeconds;
        try {
            if (playerRef.current?.getCurrentTime) {
                const t = playerRef.current.getCurrentTime();
                if (typeof t === 'number' && !Number.isNaN(t)) time = t;
            }
        } catch { }

        let volumePercent = 100;
        try {
            const internal = playerRef.current?.getInternalPlayer?.();
            if (internal?.getVolume) {
                const vol = internal.getVolume();
                if (typeof vol === 'number') volumePercent = Math.max(0, Math.min(100, Math.floor(vol)));
            }
        } catch { }

        const params: string[] = [];
        if (time > 0) params.push(`t=${Math.floor(time)}`);
        if (volumePercent !== 100) params.push(`v=${volumePercent}`);
        const qs = params.length ? `?${params.join('&')}` : '';
        return `/media/${media.slug.current}${qs}`;
    }, [media.slug.current, playedSeconds]);

    return (
        <div className="cutting-edge-card">
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
                        <div className="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center group-hover:bg-black/30 transition-all">
                            <Play className="w-8 h-8 text-black ml-1" />
                        </div>
                    </div>
                )}
                {/* Play overlay for video thumbnails */}
                {hasVideo && !isPlayingInline && (
                    <button
                        type="button"
                        onClick={handlePlayInline}
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center"
                        aria-label="Play"
                    >
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <Play className="w-8 h-8 text-black ml-1" />
                        </div>
                    </button>
                )}

                {hasVideo && isPlayingInline && (
                    <div className="absolute inset-0 z-10">
                        {youTubeId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1`}
                                width="100%"
                                height="100%"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full rounded"
                                title="Inline YouTube video"
                            />
                        ) : (
                            <ReactPlayerDynamic
                                ref={playerRef}
                                url={media.videoUrl as string}
                                width="100%"
                                height="100%"
                                playing
                                muted
                                controls
                                onProgress={(state: any) => {
                                    if (typeof state.playedSeconds === 'number') setPlayedSeconds(state.playedSeconds);
                                }}
                                onError={(e: unknown) => setInlineError('Playback error')}
                            />
                        )}
                    </div>
                )}
            </div>
            <Link href={buildDetailHref()}>
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

