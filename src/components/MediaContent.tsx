"use client";

import { useState } from "react";

interface MediaContentProps {
    description: string;
    moreBySection?: React.ReactNode;
}

export default function MediaContent({ description, moreBySection }: MediaContentProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const maxPreviewLength = 300;
    const shouldTruncate = description.length > maxPreviewLength;
    const previewText = shouldTruncate ? description.substring(0, maxPreviewLength) + '...' : description;

    if (!shouldTruncate) {
        // If content is short enough, show it all
        return (
            <div className="space-y-6">
                <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed">{description}</p>
                </div>
                {moreBySection && (
                    <div className="mt-6">
                        {moreBySection}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Clickable content area */}
            <div
                className="prose prose-lg max-w-none cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? (
                    <div className="animate-in fade-in-0 slide-in-from-top-4 duration-700 ease-out">
                        <div className="transform transition-all duration-700 ease-out">
                            <p className="text-gray-700 leading-relaxed">{description}</p>
                        </div>
                        {/* More by section inside collapsible area */}
                        {moreBySection && (
                            <div className="mt-6">
                                {moreBySection}
                            </div>
                        )}
                        {/* Subtle close hint */}
                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors duration-300">
                                <span>Click to collapse</span>
                                <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <p className="text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors duration-300">
                            {previewText}
                        </p>
                        {/* Enhanced gradient fade effect with hover hint */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none group-hover:from-gray-50 group-hover:via-gray-50/90 transition-all duration-300"></div>

                        {/* Subtle expand hint */}
                        <div className="absolute bottom-2 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-full shadow-sm">
                                <span>Click to read more</span>
                                <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
