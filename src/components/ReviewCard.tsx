"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LikeButton from "./LikeButton";

interface ReviewCardProps {
    review: {
        _id: string;
        title: string;
        slug: { current: string };
        publishedAt: string;
        artist: {
            name: string;
            slug: { current: string };
        };
        coverUrl?: string;
        blurb?: string;
    };
}

export default function ReviewCard({ review }: ReviewCardProps) {
    return (
        <div className="cutting-edge-card">
            <Link href={`/reviews/${review.slug.current}`}>
                <div className="aspect-square relative">
                    {review.coverUrl ? (
                        <Image
                            src={review.coverUrl}
                            alt={`${review.artist.name} - ${review.title}`}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">No Cover</span>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <div className="space-y-3">
                        <h3 className="cutting-edge-title line-clamp-2">{review.title}</h3>
                        <p className="cutting-edge-artist">{review.artist.name}</p>
                        {review.blurb && (
                            <p className="cutting-edge-blurb line-clamp-3">{review.blurb}</p>
                        )}
                        <div className="flex items-center justify-between">
                            <p className="cutting-edge-date">
                                {new Date(review.publishedAt).toLocaleDateString('en-US', {
                                    month: 'numeric',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                            <div onClick={(e) => e.preventDefault()}>
                                <LikeButton
                                    postId={review._id}
                                    postType="review"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

