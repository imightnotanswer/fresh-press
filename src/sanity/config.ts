import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import schemas from "./schemas";

export default defineConfig({
    name: "freshly-pressed",
    title: "Fresh Press",
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: process.env.SANITY_API_VERSION!,
    basePath: "/studio",
    plugins: [deskTool(), visionTool()],
    schema: { types: schemas },
    token: process.env.SANITY_API_TOKEN,
});

