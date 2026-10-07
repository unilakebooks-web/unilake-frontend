import { notFound } from "next/navigation";
import { fetchPublicSitePage } from "@/app/actions/public";
import { getErrorCode } from "@/lib/utils";
import type { SitePage, SitePageSlug } from "@/app/types/sitePage";

/**
 * Fetches a published legal page, or renders the 404 page.
 *
 * Shared by /privacy, /terms and /refund so the error handling exists once.
 *
 * IMPORTANT: the axios interceptor in app/lib/axios.ts rejects with a plain
 * `{ code, message }` object — there is no `.response` to inspect. Testing
 * `error?.response?.status === 404` (as the blog detail page does) can never
 * be true, which sends an unpublished page to the error boundary instead of
 * the not-found page. Match on `code` instead.
 */
export async function loadSitePage(slug: SitePageSlug): Promise<SitePage> {
  try {
    return await fetchPublicSitePage(slug);
  } catch (error: unknown) {
    if (getErrorCode(error) === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
