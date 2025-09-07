import { defineType, defineField } from "sanity";
export default defineType({
    name: "media",
    type: "document",
    title: "Media",
    fields: [
        defineField({ name: "title", type: "string", validation: r => r.required() }),
        defineField({ name: "artist", type: "reference", to: [{ type: "artist" }], validation: r => r.required() }),
        defineField({ name: "videoUrl", type: "url" }),
        defineField({ name: "description", type: "text" }),
        defineField({ name: "tags", type: "array", of: [{ type: "reference", to: [{ type: "tag" }] }] }),
        defineField({ name: "publishedAt", type: "datetime", initialValue: () => new Date().toISOString() }),
        defineField({ name: "slug", type: "slug", options: { source: (doc: any) => `${doc.artist?.name}-${doc.title}` } }),
    ],
});


