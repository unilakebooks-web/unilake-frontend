import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchSharedBook } from "@/app/actions/share";
import { fetchPublicComic } from "@/app/actions/comic";
import SharedBookViewer from "@/components/share/SharedBookViewer";
import { toImageUrl } from "@/lib/imageUrl";
import { shareTitle } from "@/lib/shareTitle";
import { SITE_NAME } from "@/lib/seo";
import { API_BASE } from "@/components/share/shareUrl";

/**
 * The public, view-only page of a shared book (feature 14, D-108/D-110/D-111/D-112).
 *
 * Rules that must not be "tidied away":
 * - A SERVER component with no loading.tsx and no Suspense around the fetch: a streamed response has already sent
 *   its 200, so it could never become a 404. A dead link must be a real 404, an API failure a non-200 error page.
 * - One fetch per request (React cache) feeds the metadata and the body.
 * - The 404 comes from `notFound()` in the page body. generateMetadata never calls it: any failure there falls back
 *   to generic metadata, so a slow or failed fetch cannot break the response.
 * - Never indexed, never in the sitemap; the share token is private.
 */
export const dynamic = "force-dynamic";

// ⚠️ Two copies of backend values (Unilake-backend src/config/share.ts): the share token shape and the width of
// the link-preview card image (SHARE_TOKEN_SHAPE, SHARE_CARD_WIDTH). Change them in both repos together.
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{32}$/;
const CARD_WIDTH = 1200;
const METADATA_TIMEOUT_MS = 5000;
const DESCRIPTION = "A personalised storybook made with Unilake Kids.";

// Keyed by the token string, so the metadata and the page body share one request.
const getBook = cache((token: string) => fetchSharedBook(token));

const GENERIC_METADATA: Metadata = {
  title: "A personalised book",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** The comic's cover, for a book with no listed page yet. A failure is not fatal: the card just has no image. */
async function coverImage(comicId: string): Promise<string | undefined> {
  try {
    return toImageUrl((await fetchPublicComic(comicId)).coverThumbnailUrls?.[0]);
  } catch {
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  if (!TOKEN_SHAPE.test(token)) return GENERIC_METADATA;

  try {
    // Never let a slow backend hold the whole response: the page body has the long timeout, this only the card.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const book = await Promise.race([
      getBook(token),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("metadata timeout")), METADATA_TIMEOUT_MS);
      }),
    ]).finally(() => clearTimeout(timer));

    const title = shareTitle(book.comic.title, book.childName);
    const first = book.pages[0];
    const image = first
      ? `${API_BASE}/api/public/shares/${token}/pages/${first.pageNumber}/card.jpg`
      : await coverImage(book.comic.id);

    // A segment's openGraph REPLACES the root layout's, so siteName/type/locale are repeated and the root's
    // homepage og:url does not carry over (no url is set: the link itself is private).
    return {
      title,
      description: DESCRIPTION,
      robots: { index: false, follow: false },
      referrer: "no-referrer",
      openGraph: {
        type: "website",
        siteName: SITE_NAME,
        title,
        description: DESCRIPTION,
        locale: "en_IN",
        ...(image && { images: [first ? { url: image, width: CARD_WIDTH } : { url: image }] }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: DESCRIPTION,
        ...(image && { images: [image] }),
      },
    };
  } catch {
    return GENERIC_METADATA;
  }
}

export default async function SharedBookPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_SHAPE.test(token)) notFound();

  let book;
  try {
    book = await getBook(token);
  } catch (err) {
    if ((err as { code?: string } | null)?.code === "NOT_FOUND") notFound();
    // Anything else (backend down, timeout) is not "gone": let error.tsx offer a retry.
    throw err;
  }

  return <SharedBookViewer token={token} book={book} />;
}
