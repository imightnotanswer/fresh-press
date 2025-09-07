import { defineType, defineField } from "sanity";
export default defineType({
    name: "review",
    type: "document",
    title: "Review",
    fields: [
        defineField({ name: "title", title: "Album Title", type: "string", validation: r => r.required() }),
        defineField({ name: "artist", type: "reference", to: [{ type: "artist" }], validation: r => r.required() }),
        defineField({ name: "cover", type: "image", options: { hotspot: true } }),
        defineField({ name: "artistSiteUrl", type: "url" }),
        defineField({ name: "albumUrl", type: "url", title: "Album Link" }),
        defineField({ name: "blurb", type: "text" }),
        defineField({ name: "body", type: "array", of: [{ type: "block" }] }),
        defineField({ name: "tags", type: "array", of: [{ type: "reference", to: [{ type: "tag" }] }] }),
        defineField({ name: "publishedAt", type: "datetime", initialValue: () => new Date().toISOString() }),
        defineField({ name: "releaseDate", type: "date", title: "Release Date" }),
        defineField({ name: "slug", type: "slug", options: { source: (doc: any) => `${doc.artist?.name}-${doc.title}` } }),
    ],
    preview: { select: { title: "title", subtitle: "artist.name", media: "cover" } },
});


