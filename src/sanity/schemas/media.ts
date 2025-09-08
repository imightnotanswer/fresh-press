import { defineType, defineField } from "sanity";
export default defineType({
    name: "media",
    type: "document",
    title: "Media",
    fields: [
        defineField({ name: "title", type: "string", validation: r => r.required() }),
        defineField({ name: "artist", type: "reference", to: [{ type: "artist" }], validation: r => r.required() }),
        defineField({
            name: "cover",
            type: "image",
            title: "Cover Image",
            options: { hotspot: true },
            fields: [
                { name: "alt", type: "string", title: "Alternative text" }
            ]
        }),
        defineField({
            name: "videoUrl",
            type: "url",
            title: "Video URL",
            description: "YouTube, Vimeo, or direct video URL"
        }),
        defineField({ name: "description", type: "text" }),
        defineField({ name: "tags", type: "array", of: [{ type: "reference", to: [{ type: "tag" }] }] }),
        defineField({ name: "publishedAt", type: "datetime", initialValue: () => new Date().toISOString() }),
        defineField({ name: "slug", type: "slug", options: { source: (doc: any) => `${doc.artist?.name}-${doc.title}` } }),
    ],
});


