import type { MetadataRoute } from "next";
import { fetchPublicComics } from "@/app/actions/comic";
import { fetchPublicBlogs } from "@/app/actions/public";
import { absoluteUrl } from "@/lib/seo";

/**
 * The list of pages handed to Google at /sitemap.xml.
 *
 * Built live from the API rather than maintained by hand, so publishing a comic
 * or a blog post puts it in the sitemap on its own — there is nothing for the
 * admin to remember to do.
 *
 * Both fetches use the PUBLIC endpoints, which already filter to published
 * comics and active blogs. Drafts therefore cannot leak into the sitemap.
 */

// Regenerate hourly. A sitemap does not need to be instant, and this keeps the
// route from hitting the API on every crawler request.
export const revalidate = 3600;

const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/comic", changeFrequency: "weekly", priority: 0.9 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/how_it_work", changeFrequency: "monthly", priority: 0.6 },
  { path: "/team", changeFrequency: "monthly", priority: 0.4 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/refund", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // allSettled, not all: one failing endpoint must not produce an empty
  // sitemap. Whatever succeeds is included, the rest is simply absent until the
  // next revalidation.
  const [comicsResult, blogsResult] = await Promise.allSettled([
    fetchPublicComics(),
    fetchPublicBlogs(),
  ]);

  const comicEntries: MetadataRoute.Sitemap =
    comicsResult.status === "fulfilled"
      ? comicsResult.value.map((comic) => ({
          url: absoluteUrl(`/comic/${comic.id}`),
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      : [];

  const blogEntries: MetadataRoute.Sitemap =
    blogsResult.status === "fulfilled"
      ? blogsResult.value.map((blog) => ({
          // Blog URLs are keyed by slug, not id — the slug is frozen at create
          // precisely so these links stay stable.
          url: absoluteUrl(`/blog/${blog.slug}`),
          lastModified: blog.updatedAt ? new Date(blog.updatedAt) : now,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
      : [];

  return [...staticEntries, ...comicEntries, ...blogEntries];
}
