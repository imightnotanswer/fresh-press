"use client";

import { useState, useEffect } from "react";
import { sanity } from "@/lib/sanity";
import { ALL_REVIEWS, ALL_MEDIA } from "@/lib/groq";
import ReviewCard from "@/components/ReviewCard";
import MediaCard from "@/components/MediaCard";
import Link from "next/link";

// Type definitions
interface Review {
  _id: string;
  title: string;
  slug: { current: string };
  artist: { name: string; slug: { current: string } };
  coverUrl?: string;
  publishedAt: string;
  blurb?: string;
  __seed?: { count: number; liked: boolean };
}

interface Media {
  _id: string;
  title: string;
  slug: { current: string };
  artist: { name: string; slug: { current: string } };
  coverUrl?: string;
  publishedAt: string;
  videoUrl?: string;
  __seed?: { count: number; liked: boolean };
}

interface LikeData {
  post_id: string;
}

interface CountData {
  post_id: string;
  like_count: number;
}

export default function HomePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        if (!sanity) {
          console.error("Sanity client not configured");
          setReviews([]);
          setMedia([]);
          return;
        }
        const [reviewsData, mediaData] = await Promise.all([
          sanity.fetch(ALL_REVIEWS),
          sanity.fetch(ALL_MEDIA)
        ]);

        // Process reviews
        const reviewIds = (reviewsData || []).map((r: Review) => r._id);
        const reviewSeedMap: Record<string, { count: number; liked: boolean }> = {};
        try {
          if (reviewIds.length) {
            const url = `/api/likes/batch?type=review&ids=${encodeURIComponent(reviewIds.join(","))}`;
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) {
              const { counts, liked } = await res.json();
              const likeMap: Record<string, number> = {};
              const likedSet = new Set<string>((liked || []).map((r: LikeData) => r.post_id));
              (counts || []).forEach((r: CountData) => {
                likeMap[r.post_id] = r.like_count ?? 0;
              });
              reviewIds.forEach((id: string) => {
                reviewSeedMap[id] = { count: likeMap[id] ?? 0, liked: likedSet.has(id) };
              });
            }
          }
        } catch { }

        const reviewsWithSeeds = (reviewsData || []).map((r: Review) => ({
          ...r,
          __seed: reviewSeedMap[r._id] || { count: 0, liked: false }
        }));

        // Process media
        const mediaIds = (mediaData || []).map((m: Media) => m._id);
        const mediaSeedMap: Record<string, { count: number; liked: boolean }> = {};
        try {
          if (mediaIds.length) {
            const url = `/api/likes/batch?type=media&ids=${encodeURIComponent(mediaIds.join(","))}`;
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) {
              const { counts, liked } = await res.json();
              const likeMap: Record<string, number> = {};
              const likedSet = new Set<string>((liked || []).map((r: LikeData) => r.post_id));
              (counts || []).forEach((r: CountData) => {
                likeMap[r.post_id] = r.like_count ?? 0;
              });
              mediaIds.forEach((id: string) => {
                mediaSeedMap[id] = { count: likeMap[id] ?? 0, liked: likedSet.has(id) };
              });
            }
          }
        } catch { }

        const mediaWithSeeds = (mediaData || []).map((m: Media) => ({
          ...m,
          __seed: mediaSeedMap[m._id] || { count: 0, liked: false }
        }));

        setReviews(reviewsWithSeeds);
        setMedia(mediaWithSeeds);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation removed: now mounted in root layout */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Hero Section */}
        <div className="mb-16 text-center md:text-left">
          <h1 className="cutting-edge-section-title">Latest Music</h1>
          <p className="cutting-edge-section-subtitle">Reviews, videos, and more from the music world</p>
        </div>

        {/* Recent Reviews Section */}
        <section className="mb-20">
          <div className="flex flex-col items-center gap-3 mb-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <h2 className="cutting-edge-section-title">Recent Reviews</h2>
              <p className="cutting-edge-section-subtitle">Latest music reviews and critiques</p>
            </div>
            <Link
              href="/reviews"
              className="cutting-edge-button-outline"
            >
              View All Reviews
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">No reviews yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 place-items-center sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {reviews.slice(0, 4).map((review: Review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Media Section */}
        <section>
          <div className="flex flex-col items-center gap-3 mb-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <h2 className="cutting-edge-section-title">Recent Media</h2>
              <p className="cutting-edge-section-subtitle">Latest videos, podcasts, and media content</p>
            </div>
            <Link
              href="/media"
              className="cutting-edge-button-outline"
            >
              View All Media
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Loading media...</p>
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">No media content yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 place-items-center sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {media.slice(0, 4).map((mediaItem: Media) => (
                <MediaCard key={mediaItem._id} media={mediaItem} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}