"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Filter, SortAsc, X } from "lucide-react";

export interface FilterSortOptions {
    sortBy: 'newest' | 'oldest' | 'alphabetical';
    selectedTags: string[];
    availableTags: { name: string; slug: string }[];
}

interface FilterSortBarProps {
    options: FilterSortOptions;
    onSortChange: (sortBy: FilterSortOptions['sortBy']) => void;
    onTagToggle: (tagSlug: string) => void;
    onClearFilters: () => void;
}

export default function FilterSortBar({
    options,
    onSortChange,
    onTagToggle,
    onClearFilters
}: FilterSortBarProps) {
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const sortLabels = {
        newest: 'Newest First',
        oldest: 'Oldest First',
        alphabetical: 'A-Z'
    };

    const hasActiveFilters = options.selectedTags.length > 0;

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-center justify-center sm:justify-between text-center sm:text-left mb-8">
            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap gap-2 justify-center">
                {/* Sort Dropdown */}
                <DropdownMenu open={isSortOpen} onOpenChange={setIsSortOpen}>
                    <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-all duration-200">
                            <SortAsc className="h-4 w-4" />
                            {sortLabels[options.sortBy]}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => { onSortChange('newest'); setIsSortOpen(false); }}>
                            Newest First
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { onSortChange('oldest'); setIsSortOpen(false); }}>
                            Oldest First
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { onSortChange('alphabetical'); setIsSortOpen(false); }}>
                            A-Z
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Filter Dropdown */}
                <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 transition-all duration-200">
                            <Filter className="h-4 w-4" />
                            Filter
                            {hasActiveFilters && (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-gray-600 rounded-full">
                                    {options.selectedTags.length}
                                </span>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        {options.availableTags.length === 0 ? (
                            <DropdownMenuItem disabled>No genres available</DropdownMenuItem>
                        ) : (
                            options.availableTags.map((tag) => {
                                const isSelected = options.selectedTags.includes(tag.slug);
                                return (
                                    <DropdownMenuItem
                                        key={tag.slug}
                                        onClick={() => { onTagToggle(tag.slug); }}
                                        className="flex items-center justify-between"
                                    >
                                        <span>{tag.name}</span>
                                        {isSelected && <span className="text-blue-600">✓</span>}
                                    </DropdownMenuItem>
                                );
                            })
                        )}
                        {hasActiveFilters && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { onClearFilters(); setIsFilterOpen(false); }}>
                                    Clear all filters
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
                    >
                        <X className="h-4 w-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 justify-center">
                    {options.selectedTags.map((tagSlug) => {
                        const tag = options.availableTags.find(t => t.slug === tagSlug);
                        return (
                            <button
                                key={tagSlug}
                                onClick={() => onTagToggle(tagSlug)}
                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200"
                            >
                                {tag?.name}
                                <X className="h-3 w-3" />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
