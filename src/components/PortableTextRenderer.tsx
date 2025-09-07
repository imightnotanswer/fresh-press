"use client";

import { PortableText } from "@portabletext/react";

interface PortableTextRendererProps {
    content: any[];
}

export default function PortableTextRenderer({ content }: PortableTextRendererProps) {
    if (!content || !Array.isArray(content)) {
        return null;
    }

    return (
        <div className="prose prose-gray max-w-none">
            <PortableText value={content} />
        </div>
    );
}


