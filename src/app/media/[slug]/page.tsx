"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { sanity } from "@/lib/sanity";
import { MEDIA_BY_SLUG, RELATED_MEDIA_BY_ARTIST } from "@/lib/groq";
import Comments from "@/components/Comments";
import AuthButton from "@/components/AuthButton";
import VideoPlayer from "@/components/VideoPlayer";
import Image from "next/image";
// Render plain iframe for YouTube links on the detail page
import { getYouTubeId } from "@/lib/youtube";
import LikeButton from "@/components/LikeButton";
import MediaContent from "@/components/MediaContent";
import { useState, useEffect } from "react";

export const dynamic = 'force-dynamic';

interface MediaPageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getMedia(slug: string) {
    try {
        if (!sanity) {
            console.error("Sanity client not configured");
            return null;
        }
        const media = await sanity.fetch(MEDIA_BY_SLUG, { slug });
        return media;
    } catch (error) {
        console.error("Error fetching media:", error);
        return null;
    }
}

async function getRelatedMedia(artistId: string) {
    try {
        if (!sanity) {
            console.error("Sanity client not configured");
            return [];
        }
        const media = await sanity.fetch(RELATED_MEDIA_BY_ARTIST, { artistId });
        return media || [];
    } catch (error) {
        console.error("Error fetching related media:", error);
        return [];
    }
}

export default function MediaPage({ params, searchParams }: MediaPageProps) {
    const [media, setMedia] = useState<any>(null);
    const [relatedMedia, setRelatedMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [seed, setSeed] = useState<{ count: number; liked: boolean }>({ count: 0, liked: false });
    const [playerUrl, setPlayerUrl] = useState<string>("");

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const resolvedParams = await params;
                const resolvedSearchParams = searchParams ? await searchParams : undefined;
                const mediaData = await getMedia(resolvedParams.slug);

                if (!mediaData) {
                    notFound();
                    return;
                }

                // Process player URL with search params
                let processedPlayerUrl = mediaData.videoUrl as string;
                const tParam = (resolvedSearchParams?.["t"] as string | undefined) ?? undefined;
                const vParam = (resolvedSearchParams?.["v"] as string | undefined) ?? (resolvedSearchParams?.["vol"] as string | undefined) ?? undefined;
                if (tParam) {
                    const sep = processedPlayerUrl.includes('?') ? '&' : '?';
                    processedPlayerUrl = `${processedPlayerUrl}${sep}t=${encodeURIComponent(tParam)}`;
                }
                if (vParam) {
                    const sep = processedPlayerUrl.includes('?') ? '&' : '?';
                    processedPlayerUrl = `${processedPlayerUrl}${sep}v=${encodeURIComponent(vParam)}`;
                }

                // Fetch like data
                try {
                    const res = await fetch(`/api/likes/batch?type=media&ids=${encodeURIComponent(mediaData._id)}`, { cache: "no-store" });
                    if (res.ok) {
                        const { counts, liked } = await res.json();
                        setSeed({
                            count: counts?.[0]?.like_count ?? 0,
                            liked: Array.isArray(liked) ? liked.some((r: any) => r.post_id === mediaData._id) : false
                        });
                    }
                } catch { }

                // Fetch related media
                const relatedData = await getRelatedMedia(mediaData.artist._id);

                setMedia(mediaData);
                setRelatedMedia(relatedData);
                setPlayerUrl(processedPlayerUrl);
            } catch (error) {
                console.error("Error loading media data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [params, searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500 text-lg">Loading media...</p>
            </div>
        );
    }

    if (!media) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* Use plain iframe for YouTube; fallback to VideoPlayer for others */}
                    {media.videoUrl && (
                        <div className="bg-black rounded-lg overflow-hidden">
                            {getYouTubeId(media.videoUrl) ? (
                                <div className="relative aspect-video">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYouTubeId(media.videoUrl)}${playerUrl.includes('t=') ? `?start=${encodeURIComponent(String(playerUrl.split('t=')[1]))}` : ''}`}
                                        width="100%"
                                        height="100%"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="w-full h-full"
                                        title="YouTube video player"
                                    />
                                </div>
                            ) : (
                                <VideoPlayer url={playerUrl} />
                            )}
                        </div>
                    )}

                    {/* Media Content */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-start justify-between gap-4">
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">{media.title}</h1>
                                <LikeButton
                                    postId={media._id}
                                    postType="media"
                                    showCount={true}
                                    hideLabel={true}
                                    initialCount={seed.count}
                                    initialLiked={seed.liked}
                                />
                            </div>
                            <p className="text-xl text-gray-600 mb-4">
                                by{" "}
                                <Link
                                    href={`/artists/${media.artist.slug.current}`}
                                    className="hover:underline"
                                >
                                    {media.artist.name}
                                </Link>
                            </p>
                            <p className="text-sm text-gray-500">
                                {new Date(media.publishedAt).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Description */}
                        {media.description && (
                            <MediaContent
                                description={media.description}
                                moreBySection={relatedMedia.length > 0 ? (
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-black">
                                        <h3 className="text-lg font-semibold text-black mb-4">
                                            More by {media.artist.name}
                                        </h3>
                                        <div className="space-y-3">
                                            {relatedMedia.map((related: any) => (
                                                <Link
                                                    key={related._id}
                                                    href={`/media/${related.slug.current}`}
                                                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                                                >
                                                    <h4 className="font-medium text-gray-900">{related.title}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(related.publishedAt).toLocaleDateString()}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ) : undefined}
                            />
                        )}
                    </div>

                    {/* Comments */}
                    <Comments postType="media" postId={media._id} />
                </div>
            </main>
        </div>
    );
}