import { defineType, defineField } from "sanity";
export default defineType({
    name: "artist",
    type: "document",
    title: "Artist",
    fields: [
        defineField({ name: "name", type: "string", validation: r => r.required() }),
        defineField({ name: "slug", type: "slug", options: { source: "name" }, validation: r => r.required() }),
        defineField({ name: "website", type: "url" }),
        defineField({ name: "image", type: "image", options: { hotspot: true } }),
    ],
});


