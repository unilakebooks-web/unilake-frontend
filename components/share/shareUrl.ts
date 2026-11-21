// The absolute address of a page of this site, for client components (feature 14).
//
// Not lib/seo's absoluteUrl: that file imports next/cache and the server actions, and no client component imports
// it. Same site address and the same joining rule; keep the two in step.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.unilakekids.com").replace(/\/$/, "");

export function shareUrl(path: string): string {
  return `${SITE_URL}/${path.replace(/^\//, "")}`;
}

/** The backend the share routes live on: the same address app/lib/axios.ts uses. */
export const API_BASE = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080";
