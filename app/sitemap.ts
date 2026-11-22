import type { MetadataRoute } from "next";
import { fetchPublicComics } from "@/app/actions/comic";
import { fetchPublicBlogs } from "@/app/actions/public";
import { absoluteUrl, laterDate } from "@/lib/seo";
import { comicHref } from "@/lib/comicUrl";

/**
 * The list of pages handed to Google at /sitemap.xml.
 *
 * Built live from the API rather than maintained by hand, so publishing a comic
 * or a blog post puts it in the sitemap on its own - there is nothing for the
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
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/reviews", changeFrequency: "weekly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No lastModified on the fixed pages: there is no real date to give, and Google only trusts a date that is
  // accurate, so a "now" that changes every hour would teach it to ignore all of them.
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
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
          url: absoluteUrl(comicHref(comic)),
          lastModified: comic.updatedAt ? new Date(comic.updatedAt) : undefined,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      : [];

  const blogEntries: MetadataRoute.Sitemap =
    blogsResult.status === "fulfilled"
      ? blogsResult.value.map((blog) => ({
          // Blog URLs are keyed by slug, not id - the slug is frozen at create
          // precisely so these links stay stable.
          url: absoluteUrl(`/blog/${blog.slug}`),
          // The date of the last real content change; updatedAt also moves on the publish switch.
          lastModified: new Date(laterDate(blog.contentUpdatedAt, blog.publishedAt ?? blog.createdAt)),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        }))
      : [];

  return [...staticEntries, ...comicEntries, ...blogEntries];
}
