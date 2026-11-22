import { cache } from "react";
import { fetchPublicComic } from "@/app/actions/comic";
import { getErrorCode } from "@/lib/utils";
import type { PublicComicDetail } from "@/app/types/comic";

/**
 * What the server learned about a comic address (an id, the current slug or an old slug).
 *
 * Three outcomes, kept apart on purpose: only "missing" may become a 404 and only "ok" may become a redirect.
 * A backend error or timeout is "error": telling search engines a page is gone (or moved) because the API
 * blinked once would drop good pages from the index, so the page is rendered as before and loads itself.
 */
export type ComicLookup =
  | { status: "ok"; comic: PublicComicDetail }
  | { status: "missing" }
  | { status: "error" };

/**
 * The comic layout's body and its generateMetadata both need the comic. React `cache` makes them share one
 * request (fetchPublicComic is axios, which Next does not dedupe), like getSiteSetting in lib/seo.ts.
 *
 * The axios interceptor rejects with a plain `{ code, message }` object, so a 404 is matched on the code,
 * exactly as loadBlog does.
 */
export const loadComic = cache(async (idOrSlug: string): Promise<ComicLookup> => {
  try {
    return { status: "ok", comic: await fetchPublicComic(idOrSlug) };
  } catch (error: unknown) {
    return getErrorCode(error) === "NOT_FOUND" ? { status: "missing" } : { status: "error" };
  }
});
