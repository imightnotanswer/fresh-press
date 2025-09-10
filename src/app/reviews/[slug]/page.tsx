"use client";

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { sanity } from "@/lib/sanity";
import { REVIEW_BY_SLUG, RELATED_BY_ARTIST } from "@/lib/groq";
import PortableTextRenderer from "@/components/PortableTextRenderer";
import Comments from "@/components/Comments";
import AuthButton from "@/components/AuthButton";
import ReviewContent from "@/components/ReviewContent";
import ClickableImage from "@/components/ClickableImage";
import LikeButton from "@/components/LikeButton";
import MusicPlayer from "@/components/MusicPlayer";
import { useState, useEffect } from "react";

export const dynamic = 'force-dynamic';

interface ReviewPageProps {
    params: Promise<{
        slug: string;
    }>;
}

interface Review {
    _id: string;
    title: string;
    slug: { current: string };
    publishedAt: string;
    releaseDate?: string;
    blurb?: string;
    artistSiteUrl?: string;
    albumUrl?: string;
    songTitle?: string;
    artist: {
        _id: string;
        name: string;
        slug: { current: string };
        image?: { asset: { url: string } };
    };
    cover?: { asset: { url: string } };
    body?: any[];
    audioFile?: {
        asset: {
            url: string;
            originalFilename?: string;
        };
    };
}

async function getReview(slug: string) {
    try {
        if (!sanity) {
            console.error("Sanity client not configured");
            return null;
        }
        const review = await sanity.fetch(REVIEW_BY_SLUG, { slug });
        return review;
    } catch (error) {
        console.error("Error fetching review:", error);
        return null;
    }
}

async function getRelatedReviews(artistId: string) {
    try {
        if (!sanity) {
            console.error("Sanity client not configured");
            return [];
        }
        const reviews = await sanity.fetch(RELATED_BY_ARTIST, { artistId });
        return reviews || [];
    } catch (error) {
        console.error("Error fetching related reviews:", error);
        return [];
    }
}

export default function ReviewPage({ params }: ReviewPageProps) {
    const [review, setReview] = useState<Review | null>(null);
    const [relatedReviews, setRelatedReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [seed, setSeed] = useState<{ count: number; liked: boolean }>({ count: 0, liked: false });

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const resolvedParams = await params;
                const reviewData = await getReview(resolvedParams.slug);

                if (!reviewData) {
                    notFound();
                    return;
                }

                // Fetch like data
                try {
                    const res = await fetch(`/api/likes/batch?type=review&ids=${encodeURIComponent(reviewData._id)}`, { cache: "no-store" });
                    if (res.ok) {
                        const { counts, liked } = await res.json();
                        setSeed({
                            count: counts?.[0]?.like_count ?? 0,
                            liked: Array.isArray(liked) ? liked.some((r: any) => r.post_id === reviewData._id) : false
                        });
                    }
                } catch { }

                // Fetch related reviews
                const relatedData = await getRelatedReviews(reviewData.artist._id);

                setReview(reviewData);
                setRelatedReviews(relatedData);
            } catch (error) {
                console.error("Error loading review data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [params]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500 text-lg">Loading review...</p>
            </div>
        );
    }

    if (!review) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    {/* Cover Image - Clickable to Album Link */}
                    {review.cover?.asset?.url && (
                        <div className="aspect-square max-w-md mx-auto">
                            <ClickableImage
                                src={review.cover.asset.url}
                                alt={`${review.artist.name} - ${review.title}`}
                                className="w-full h-full object-cover rounded-lg shadow-lg cursor-pointer hover:opacity-90 transition-opacity duration-200"
                                href={review.albumUrl}
                            />
                        </div>
                    )}

                    {/* Review Content */}
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-start justify-between gap-4">
                                <h1 className="text-4xl font-bold text-gray-900 mb-2">{review.title}</h1>
                                <LikeButton
                                    postId={review._id}
                                    postType="review"
                                    showCount={true}
                                    hideLabel={true}
                                    initialCount={seed.count}
                                    initialLiked={seed.liked}
                                />
                            </div>
                            <p className="text-xl text-gray-600 mb-4">
                                by{" "}
                                <Link
                                    href={`/artists/${review.artist.slug.current}`}
                                    className="hover:underline"
                                >
                                    {review.artist.name}
                                </Link>
                            </p>
                            <p className="text-sm text-gray-500">
                                {new Date(review.publishedAt).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Music Player */}
                        {review.audioFile?.asset?.url ? (
                            <div className="mt-2">
                                <MusicPlayer
                                    audioUrl={review.audioFile.asset.url}
                                    songTitle={review.songTitle}
                                    artistName={review.artist.name}
                                />
                            </div>
                        ) : (
                            <div className="mt-2 p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                                No audio file uploaded for this review. Upload an MP3 file in Sanity Studio to see the music player.
                            </div>
                        )}

                        {/* Seamless Review Reading */}
                        {review.body && (
                            <ReviewContent
                                content={review.body}
                                maxPreviewLength={300}
                                moreBySection={relatedReviews.length > 0 ? (
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-black">
                                        <h3 className="text-lg font-semibold text-black mb-4">
                                            More by {review.artist.name}
                                        </h3>
                                        <div className="space-y-3">
                                            {relatedReviews.map((related: any) => (
                                                <Link
                                                    key={related._id}
                                                    href={`/reviews/${related.slug.current}`}
                                                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                                                >
                                                    <h4 className="font-medium text-gray-900">{related.title}</h4>
                                                    <p className="text-sm text-gray-500">
                                                        {related.releaseDate
                                                            ? new Date(related.releaseDate).toLocaleDateString()
                                                            : ''
                                                        }
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
                    <Comments postType="review" postId={review._id} />
                </div>
            </main>
        </div>
    );
}