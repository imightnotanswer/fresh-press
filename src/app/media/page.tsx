"use client";

import { useState, useEffect } from "react";
import { sanity } from "@/lib/sanity";
import { ALL_TAGS, ALL_MEDIA, buildMediaQuery } from "@/lib/groq";
import MediaCard from "@/components/MediaCard";
import FilterSortBar, { FilterSortOptions } from "@/components/FilterSortBar";

export default function MediaPage() {
    const [media, setMedia] = useState<any[]>([]);
    const [tags, setTags] = useState<{ name: string; slug: string }[]>([]);
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
                    setMedia([]);
                    setTags([]);
                    return;
                }
                const [mediaData, tagsData] = await Promise.all([
                    sanity.fetch(ALL_MEDIA),
                    sanity.fetch(ALL_TAGS)
                ]);

                setMedia(mediaData || []);
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

    // Refetch media when filters change
    useEffect(() => {
        // Skip if this is the initial load
        if (filterOptions.availableTags.length === 0) return;

        async function fetchFilteredMedia() {
            try {
                setLoading(true);
                if (!sanity) {
                    console.error("Sanity client not configured");
                    setMedia([]);
                    return;
                }
                const mediaData = await sanity.fetch(buildMediaQuery({
                    tagIds: filterOptions.selectedTags,
                    sortBy: filterOptions.sortBy
                }));
                setMedia(mediaData || []);
            } catch (error) {
                console.error("Error fetching filtered media:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchFilteredMedia();
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
                    <h1 className="cutting-edge-section-title">Media</h1>
                    <p className="cutting-edge-section-subtitle">Videos, podcasts, and other media content</p>
                </div>

                <FilterSortBar
                    options={filterOptions}
                    onSortChange={handleSortChange}
                    onTagToggle={handleTagToggle}
                    onClearFilters={handleClearFilters}
                />

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">Loading media...</p>
                    </div>
                ) : media.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">
                            {filterOptions.selectedTags.length > 0
                                ? "No media matches your filters. Try adjusting your search."
                                : "No media content yet. Check back soon!"
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 place-items-center sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                        {media.map((mediaItem: any) => (
                            <MediaCard key={mediaItem._id} media={mediaItem} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
