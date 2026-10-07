/**
 * The three editable legal pages. Mirrors the SitePageSlug enum in the backend
 * schema. CONTACT is deliberately not here — contact details are structured
 * fields on SiteSetting and live under admin Settings, not Pages.
 */
export type SitePageSlug = "PRIVACY" | "TERMS" | "REFUND";

export const SITE_PAGE_SLUGS: SitePageSlug[] = ["PRIVACY", "TERMS", "REFUND"];

/** Human labels for the admin UI and public page headings. */
export const SITE_PAGE_LABELS: Record<SitePageSlug, string> = {
  PRIVACY: "Privacy Policy",
  TERMS: "Terms and Conditions",
  REFUND: "Refund Policy",
};

/** The public route each slug is served at. */
export const SITE_PAGE_ROUTES: Record<SitePageSlug, string> = {
  PRIVACY: "/privacy",
  TERMS: "/terms",
  REFUND: "/refund",
};

/**
 * A site page as the admin API returns it.
 *
 * `id`, `createdAt` and `updatedAt` are nullable and that is load-bearing: the
 * admin list always returns all three slugs, and a page the admin has never
 * saved comes back as a synthesized placeholder with `id: null`. That null is
 * the only signal that a page does not exist yet — it gates the publish toggle,
 * since the backend rejects publishing a page with no content.
 *
 * The public API only ever returns saved, published rows, so these are never
 * null there.
 */
export type SitePage = {
  id: string | null;
  slug: SitePageSlug;
  title: string;
  body: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

/** Narrowing helper — a page the admin has actually saved at least once. */
export function isSavedSitePage(page: SitePage): boolean {
  return page.id !== null;
}
