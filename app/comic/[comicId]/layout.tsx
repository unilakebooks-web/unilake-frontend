import type { Metadata } from "next";
import { fetchPublicComic } from "@/app/actions/comic";
import {
  absoluteUrl,
  clampDescription,
  firstNonEmpty,
  getSiteSetting,
  DEFAULT_DESCRIPTION,
} from "@/lib/seo";

/**
 * This layout exists ONLY to give each comic page its own title, description
 * and share image.
 *
 * Why a layout and not the page: `page.tsx` in this folder is a client
 * component ("use client"), and Next cannot take `generateMetadata` from a
 * client component. A layout on the same dynamic segment receives the same
 * `params` and wraps the page, so the metadata lands on exactly the right route
 * without the page having to be rewritten.
 *
 * NOTE: this fixes the <title> and the WhatsApp/Facebook preview card, which
 * are served in the initial HTML. It does NOT make the comic's body content
 * server-rendered — that page still fetches its data in the browser. Making the
 * content itself crawlable is a separate, larger change that was deliberately
 * deferred.
 */

interface ComicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ comicId: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ comicId: string }>;
}): Promise<Metadata> {
  const { comicId } = await params;
  const canonical = absoluteUrl(`/comic/${comicId}`);

  try {
    const [comic, setting] = await Promise.all([
      fetchPublicComic(comicId),
      getSiteSetting(),
    ]);

    // The fallback chain, in order: the admin's explicit SEO override, then the
    // comic's own copy, then the site-wide default.
    const title = firstNonEmpty(comic.metaTitle, comic.title) ?? "Comic";
    const description =
      firstNonEmpty(
        comic.metaDescription,
        comic.description,
        setting?.metaDescription
      ) ?? DEFAULT_DESCRIPTION;

    // The first thumbnail is the primary cover by contract, and is already a
    // full public R2 URL — so comic share cards need no extra upload.
    const coverImage = comic.coverThumbnailUrls?.[0];

    return {
      title,
      description: clampDescription(description),
      alternates: { canonical },
      openGraph: {
        type: "article",
        title,
        description: clampDescription(description),
        url: canonical,
        ...(coverImage && {
          images: [{ url: coverImage, alt: comic.title }],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: clampDescription(description),
        ...(coverImage && { images: [coverImage] }),
      },
    };
  } catch {
    // An unpublished/deleted comic, or the API being unreachable, must not turn
    // a metadata lookup into a 500. The page itself still renders its own
    // "Comic Not Found" state; this just gives the tab a sane title.
    return {
      title: "Comic",
      description: DEFAULT_DESCRIPTION,
      alternates: { canonical },
    };
  }
}

export default async function ComicDetailLayout({ children }: ComicLayoutProps) {
  return <>{children}</>;
}
