import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { fetchPublicPageSeo, fetchPublicSiteSetting } from "@/app/actions/public";
import type { SiteSetting } from "@/app/types/siteSetting";
import type { PageSeoSlug } from "@/app/types/seo";
import { toImageUrl } from "@/lib/imageUrl";

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
/** Structured data only (WebSite and Organization): page titles keep using SITE_NAME. */
export const BRAND_NAME = "UniLake Kids";
export const BRAND_ALTERNATE_NAME = "UniLake";
export const DEFAULT_TITLE = "UniLake: Personalized Storybooks for Kids";
export const DEFAULT_DESCRIPTION =
  "Turn your child into the hero of their own comic book. Upload a photo, pick a story, and we print and deliver it.";

/**
 * The public address of the site itself - NOT the API.
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

/**
 * The share picture of every page that has none of its own: the logo on the site's cream background, 1200x630.
 * A path under public/, made absolute by absoluteUrl where it is used.
 */
export const DEFAULT_OG_IMAGE = {
  path: "/assets/og-default.png",
  width: 1200,
  height: 630,
  alt: "UniLake: personalized storybooks for kids",
};

/** One row of GET /public/page-seo; only pages the admin has saved appear. */
export type PageSeoPublic = {
  slug: PageSeoSlug;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  ogImageAlt: string | null;
};

/**
 * The admin's SEO text for the fixed pages, cached for five minutes exactly like the site settings above
 * (same two layers, same reasons). fetchPublicPageSeo throws on failure so that a failure is not cached;
 * it is caught here, and the page then shows its fixed text.
 */
const getPageSeoListCached = unstable_cache(
  async () => fetchPublicPageSeo(),
  ["public-page-seo"],
  { revalidate: REVALIDATE_SECONDS, tags: ["page-seo"] }
);

const getPageSeoList = cache(async (): Promise<PageSeoPublic[]> => {
  try {
    return await getPageSeoListCached();
  } catch {
    return [];
  }
});

/** The saved SEO text of one fixed page, or null when the admin saved nothing for it. */
export async function getPageSeo(slug: PageSeoSlug): Promise<PageSeoPublic | null> {
  const items = await getPageSeoList();
  return items.find((item) => item.slug === slug) ?? null;
}

/**
 * The complete metadata of a fixed public page: the admin's SEO text when set, today's fixed text otherwise,
 * with its own canonical, description and share tags.
 *
 * Why every page repeats siteName, type and locale: Next replaces `openGraph` and `twitter` wholesale with
 * the deepest segment's object (it does not merge field by field), so a page that sets its own would
 * otherwise lose them, and a page that sets none would show the homepage's title and url.
 *
 * `title` and `description` are the fixed fallbacks. The homepage passes neither: it keeps the root layout's
 * title (the site settings text) unless the admin saved one for it.
 */
export async function buildPageMetadata({
  slug,
  path,
  title,
  description,
}: {
  slug: PageSeoSlug;
  path: string;
  title?: string;
  description?: string;
}): Promise<Metadata> {
  const [seo, setting] = await Promise.all([getPageSeo(slug), getSiteSetting()]);

  const pageTitle = firstNonEmpty(seo?.metaTitle, title);
  const pageDescription =
    firstNonEmpty(seo?.metaDescription, description, setting?.metaDescription) ?? DEFAULT_DESCRIPTION;
  const shareTitle =
    firstNonEmpty(seo?.ogTitle, seo?.metaTitle, title, setting?.metaTitle) ?? DEFAULT_TITLE;
  const shareDescription = firstNonEmpty(seo?.ogDescription, pageDescription) ?? DEFAULT_DESCRIPTION;

  const ogImage = seo?.ogImageUrl
    ? { url: toImageUrl(seo.ogImageUrl), alt: firstNonEmpty(seo.ogImageAlt, shareTitle) ?? shareTitle }
    : {
        url: absoluteUrl(DEFAULT_OG_IMAGE.path),
        width: DEFAULT_OG_IMAGE.width,
        height: DEFAULT_OG_IMAGE.height,
        alt: DEFAULT_OG_IMAGE.alt,
      };
  // The homepage address has no trailing slash, as the root layout has always declared it.
  const url = path === "/" ? SITE_URL : absoluteUrl(path);

  return {
    // Homepage: no title unless the admin saved one, so the root layout's default (no suffix) still applies.
    ...(pageTitle && { title: slug === "HOME" ? { absolute: pageTitle } : pageTitle }),
    description: pageDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      url,
      title: shareTitle,
      description: shareDescription,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
      images: [ogImage.url],
    },
  };
}
