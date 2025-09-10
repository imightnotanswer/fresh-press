"use client";

import { useState, useEffect } from "react";
import { sanity } from "@/lib/sanity";
import { ALL_TAGS, ALL_REVIEWS, buildReviewsQuery } from "@/lib/groq";
import ReviewCard from "@/components/ReviewCard";
import FilterSortBar, { FilterSortOptions } from "@/components/FilterSortBar";

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

interface LikeData {
    post_id: string;
}

interface CountData {
    post_id: string;
    like_count: number;
}

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [, setTags] = useState<{ name: string; slug: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterOptions, setFilterOptions] = useState<FilterSortOptions>({
        sortBy: 'newest',
        selectedTags: [],
        availableTags: []
    });

    // Load initial data
    useEffect(() => {
        async function loadInitialData() {
            try {
                setLoading(true);
                if (!sanity) {
                    console.error("Sanity client not configured");
                    setReviews([]);
                    setTags([]);
                    return;
                }
                const [reviewsData, tagsData] = await Promise.all([
                    sanity.fetch(ALL_REVIEWS),
                    sanity.fetch(ALL_TAGS)
                ]);

                const ids = (reviewsData || []).map((r: Review) => r._id);
                const seedMap: Record<string, { count: number; liked: boolean }> = {};
                try {
                    if (ids.length) {
                        const url = `/api/likes/batch?type=review&ids=${encodeURIComponent(ids.join(","))}`;
                        const res = await fetch(url, { cache: "no-store" });
                        if (res.ok) {
                            const { counts, liked } = await res.json();
                            const likeMap: Record<string, number> = {};
                            const likedSet = new Set<string>((liked || []).map((r: LikeData) => r.post_id));
                            (counts || []).forEach((r: CountData) => {
                                likeMap[r.post_id] = r.like_count ?? 0;
                            });
                            ids.forEach((id: string) => {
                                seedMap[id] = { count: likeMap[id] ?? 0, liked: likedSet.has(id) };
                            });
                        }
                    }
                } catch { }

                const withSeeds = (reviewsData || []).map((r: Review) => ({
                    ...r,
                    __seed: seedMap[r._id] || { count: 0, liked: false }
                }));

                setReviews(withSeeds);
                setTags(tagsData || []);
                setFilterOptions(prev => ({
                    ...prev,
                    availableTags: tagsData || []
                }));
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadInitialData();
    }, []);

    // Refetch reviews when filters change
    useEffect(() => {
        // Skip if this is the initial load
        if (filterOptions.availableTags.length === 0) return;

        async function fetchFilteredReviews() {
            try {
                setLoading(true);
                if (!sanity) {
                    console.error("Sanity client not configured");
                    setReviews([]);
                    return;
                }
                const reviewsData = await sanity.fetch(buildReviewsQuery({
                    tagIds: filterOptions.selectedTags,
                    sortBy: filterOptions.sortBy
                }));
                // Re-attach seeds for filtered result
                const ids = (reviewsData || []).map((r: Review) => r._id);
                const seedMap: Record<string, { count: number; liked: boolean }> = {};
                try {
                    if (ids.length) {
                        const url = `/api/likes/batch?type=review&ids=${encodeURIComponent(ids.join(","))}`;
                        const res = await fetch(url, { cache: "no-store" });
                        if (res.ok) {
                            const { counts, liked } = await res.json();
                            const likeMap: Record<string, number> = {};
                            const likedSet = new Set<string>((liked || []).map((r: LikeData) => r.post_id));
                            (counts || []).forEach((r: CountData) => { likeMap[r.post_id] = r.like_count ?? 0; });
                            ids.forEach((id: string) => { seedMap[id] = { count: likeMap[id] ?? 0, liked: likedSet.has(id) }; });
                        }
                    }
                } catch { }
                const withSeeds = (reviewsData || []).map((r: Review) => ({ ...r, __seed: seedMap[r._id] || { count: 0, liked: false } }));
                setReviews(withSeeds);
            } catch (error) {
                console.error("Error fetching filtered reviews:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchFilteredReviews();
    }, [filterOptions.selectedTags, filterOptions.sortBy, filterOptions.availableTags.length]);

    const handleSortChange = (sortBy: FilterSortOptions['sortBy']) => {
        setFilterOptions(prev => ({ ...prev, sortBy }));
    };

    const handleTagToggle = (tagSlug: string) => {
        setFilterOptions(prev => ({
            ...prev,
            selectedTags: prev.selectedTags.includes(tagSlug)
                ? prev.selectedTags.filter(slug => slug !== tagSlug)
                : [...prev.selectedTags, tagSlug]
        }));
    };

    const handleClearFilters = () => {
        setFilterOptions(prev => ({
            ...prev,
            selectedTags: []
        }));
    };

    return (
        <div className="min-h-screen bg-white">

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 text-center md:text-left">
                    <h1 className="cutting-edge-section-title">Reviews</h1>
                    <p className="cutting-edge-section-subtitle">Music reviews and critiques</p>
                </div>

                <FilterSortBar
                    options={filterOptions}
                    onSortChange={handleSortChange}
                    onTagToggle={handleTagToggle}
                    onClearFilters={handleClearFilters}
                />

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">Loading reviews...</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            {filterOptions.selectedTags.length > 0
                                ? "No reviews match your filters. Try adjusting your search."
                                : "No reviews yet. Check back soon!"
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 place-items-center sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                        {reviews.map((review: Review) => (
                            <ReviewCard key={review._id} review={review} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
