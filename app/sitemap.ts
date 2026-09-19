import type { MetadataRoute } from "next";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { siteUrl } from "@/lib/seo";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const files = await readdir(path.join(process.cwd(), "content/docs"));
  const docs = files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) =>
      file === "index.mdx" ? "/docs" : `/docs/${file.slice(0, -4)}`,
    );
  return [
    "/",
    "/phone",
    "/examples",
    "/examples/settings",
    "/examples/inbox",
    ...docs,
  ]
    .sort()
    .map((route) => ({ url: new URL(route, siteUrl).href }));
}
