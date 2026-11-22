/** SEO text of the fixed public pages. Mirrors the PageSeoSlug enum in the backend schema. */
export type PageSeoSlug =
  | "HOME"
  | "COMICS"
  | "HOW_IT_WORKS"
  | "BLOGS"
  | "CONTACT"
  | "TEAM"
  | "ABOUT"
  | "PRIVACY"
  | "TERMS"
  | "REFUND";

export const PAGE_SEO_SLUGS: PageSeoSlug[] = [
  "HOME",
  "COMICS",
  "HOW_IT_WORKS",
  "BLOGS",
  "CONTACT",
  "TEAM",
  "ABOUT",
  "PRIVACY",
  "TERMS",
  "REFUND",
];

/** Human labels for the admin screen. */
export const PAGE_SEO_LABELS: Record<PageSeoSlug, string> = {
  HOME: "Home",
  COMICS: "Explore Comics",
  HOW_IT_WORKS: "How It Works",
  BLOGS: "Blogs",
  CONTACT: "Contact",
  TEAM: "Team",
  ABOUT: "About Us",
  PRIVACY: "Privacy Policy",
  TERMS: "Terms and Conditions",
  REFUND: "Refund Policy",
};

/** The public route of each page. */
export const PAGE_SEO_ROUTES: Record<PageSeoSlug, string> = {
  HOME: "/",
  COMICS: "/comic",
  HOW_IT_WORKS: "/how_it_work",
  BLOGS: "/blog",
  CONTACT: "/contact",
  TEAM: "/team",
  ABOUT: "/about",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  REFUND: "/refund",
};

/**
 * One page's SEO row as the admin API returns it. The admin list always returns all ten slugs; a page
 * never saved comes back as a placeholder with `id: null` and every text field null.
 */
export type PageSeo = {
  id: string | null;
  slug: PageSeoSlug;
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  ogImageAlt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

/** Save payload. A null or empty string clears a field. `ogImageKey` is the key from the upload-url call. */
export type PageSeoPayload = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageKey?: string | null;
  ogImageAlt?: string | null;
};
