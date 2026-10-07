import { notFound } from "next/navigation";
import { fetchPublicBlogBySlug } from "@/app/actions/public";
import { getErrorCode } from "@/lib/utils";
import type { Blog } from "@/app/types/blog";

/**
 * Fetches a published blog post, or renders the 404 page.
 *
 * The mirror of components/legal/loadSitePage.ts, and for the same reason: the
 * axios interceptor in app/lib/axios.ts rejects with a plain `{ code, message }`
 * object, NOT an AxiosError. There is no `.response` on it.
 *
 * This page previously tested `error?.response?.status === 404`, which can never
 * be true — so `notFound()` was unreachable and every missing or unpublished
 * slug fell through to `throw`, hitting the error boundary and rendering a 500
 * where a 404 belonged. `loadSitePage` already carried a comment naming this
 * file as the offender; this is that fix.
 *
 * Match on the error CODE. Anything that is not a genuine "no such post" is
 * rethrown untouched — a backend outage is a real error and must not be
 * disguised as a missing page.
 */
export async function loadBlog(slug: string): Promise<Blog> {
  try {
    return await fetchPublicBlogBySlug(slug);
  } catch (error: unknown) {
    if (getErrorCode(error) === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}
