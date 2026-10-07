import { cache } from "react";
import { unstable_cache } from "next/cache";
import { fetchPublicSiteSetting } from "@/app/actions/public";
import type { SiteSetting } from "@/app/types/siteSetting";

/**
 * Shared SEO plumbing for every page's metadata.
 *
 * One rule runs through this whole file: metadata must NEVER be able to break a
 * page. Every lookup here degrades to a sensible default rather than throwing,
 * because a failed title lookup taking down the homepage would be a far worse
 * outcome than a generic title.
 */

/** Used whenever the admin has saved nothing, or the API is unreachable. */
export const SITE_NAME = "UniLake";
export const DEFAULT_TITLE = "UniLake — Personalized Storybooks for Kids";
export const DEFAULT_DESCRIPTION =
  "Turn your child into the hero of their own comic book. Upload a photo, pick a story, and we print and deliver it.";

/**
 * The public address of the site itself — NOT the API.
 *
 * Needed for canonical links and for the absolute URLs a sitemap and social
 * share cards require. Falls back to the production host so a missing env var
 * degrades to correct-in-production rather than to "undefined" appearing in
 * every canonical tag.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.unilakekids.com"
).replace(/\/$/, "");

/** Joins a path onto SITE_URL, tolerating a leading slash or not. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}/${path.replace(/^\//, "")}`;
}

/**
 * The site-wide settings row, cached for five minutes.
 *
 * Two layers, doing different jobs:
 *
 * - `unstable_cache` keeps the result for 5 minutes ACROSS requests. Without
 *   it, making the root layout's metadata database-driven would opt every page
 *   in the app out of static rendering and add an API round-trip to every
 *   single page view. The cost is that a site-title edit takes up to five
 *   minutes to appear; change REVALIDATE_SECONDS to 0 for instant updates at
 *   the price of that round-trip.
 * - `cache` (React) dedupes WITHIN one request, so a page that reads settings
 *   in both generateMetadata and its body only fetches once.
 *
 * fetchPublicSiteSetting already swallows its own errors and returns null, so
 * there is deliberately no try/catch here.
 */
const REVALIDATE_SECONDS = 300;

const getSiteSettingCached = unstable_cache(
  async () => fetchPublicSiteSetting(),
  ["public-site-settings"],
  { revalidate: REVALIDATE_SECONDS, tags: ["site-settings"] }
);

export const getSiteSetting = cache(
  async (): Promise<SiteSetting | null> => {
    try {
      return await getSiteSettingCached();
    } catch {
      // Belt and braces: if the cache layer itself throws (build-time edge
      // cases), metadata still resolves to the defaults.
      return null;
    }
  }
);

/**
 * Trims a description to something a search engine will actually display, on a
 * word boundary. Google truncates around 160 characters; the admin is allowed
 * to save more than that, and a mid-word cut looks like a bug.
 */
export function clampDescription(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Strips HTML and collapses whitespace, for turning rich-text into a plain
 * description. Blog bodies are stored as unsanitised HTML, so anything derived
 * from them must never reach a meta tag with markup still in it.
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The first non-empty value, or null. Expresses the fallback chain that every
 * page uses: explicit SEO override -> the page's own content -> nothing.
 */
export function firstNonEmpty(
  ...values: (string | null | undefined)[]
): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}
