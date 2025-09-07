import { defineType, defineField } from "sanity";
export default defineType({
    name: "tag",
    type: "document",
    title: "Tag",
    fields: [
        defineField({ name: "name", type: "string", validation: r => r.required() }),
        defineField({ name: "slug", type: "slug", options: { source: "name" }, validation: r => r.required() }),
    ],
});


