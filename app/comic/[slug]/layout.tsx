import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { toImageUrl } from "@/lib/imageUrl";
import { comicHref } from "@/lib/comicUrl";
import { loadComic } from "@/components/comic/loadComic";
import JsonLd from "@/components/seo/JsonLd";
import { CoverType, type PublicComicDetail } from "@/app/types/comic";
import {
  absoluteUrl,
  clampDescription,
  firstNonEmpty,
  getSiteSetting,
  BRAND_NAME,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo";

/**
 * This layout gives each comic page its address rules, its title, description and share image, its
 * structured data, and the comic itself in the first HTML.
 *
 * Why a layout and not the page: `page.tsx` in this folder is a client component ("use client"), and Next
 * cannot take `generateMetadata` from a client component. A layout on the same dynamic segment receives the
 * same `params` and wraps the page.
 *
 * The address decision (404, or a permanent redirect to the current slug) is made in the layout BODY, not in
 * generateMetadata: metadata may be streamed after the response has started, and by then the status code
 * can no longer change.
 */

interface ComicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lookup = await loadComic(slug);

  if (lookup.status !== "ok") {
    // Missing: the layout body answers 404 (Next adds noindex). Error: the API is having a bad moment, so the
    // tab still gets a sane title and the page loads itself. Neither lookup must turn into a 500 here.
    return {
      title: "Comic",
      description: DEFAULT_DESCRIPTION,
      alternates: { canonical: absoluteUrl(`/comic/${slug}`) },
    };
  }

  const { comic } = lookup;
  // The CURRENT slug, also when the visitor arrived by id: the redirect in the body sends them there anyway.
  const canonical = absoluteUrl(comicHref(comic));
  const setting = await getSiteSetting();

  // The fallback chain, in order: the admin's explicit SEO override, then the comic's own copy, then the
  // site-wide default. The share fields (og*) fall back to the SEO fields and then to the same chain.
  const title = firstNonEmpty(comic.metaTitle, comic.title) ?? "Comic";
  const description = clampDescription(
    firstNonEmpty(
      comic.metaDescription,
      comic.description,
      setting?.metaDescription
    ) ?? DEFAULT_DESCRIPTION
  );
  const shareTitle = firstNonEmpty(comic.ogTitle, title) ?? title;
  const ogDescription = firstNonEmpty(comic.ogDescription);
  const shareDescription = ogDescription ? clampDescription(ogDescription) : description;

  // The share image the admin uploaded, else the first thumbnail (the primary cover by contract). Both are
  // full public R2 URLs, so comic share cards need no extra upload.
  const shareImage = toImageUrl(firstNonEmpty(comic.ogImageUrl, comic.coverThumbnailUrls?.[0]));
  const shareImageAlt = comic.ogImageUrl
    ? comic.title
    : firstNonEmpty(comic.coverThumbnailAlts?.[0], comic.title) ?? comic.title;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      // Repeated here because Next replaces the root layout's openGraph object instead of merging into it.
      siteName: SITE_NAME,
      locale: "en_IN",
      title: shareTitle,
      description: shareDescription,
      url: canonical,
      ...(shareImage && {
        images: [{ url: shareImage, alt: shareImageAlt }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
      ...(shareImage && { images: [shareImage] }),
    },
  };
}

/**
 * The one INR price search engines get, from the same India softcover rule the visible price uses. A comic
 * with no such rule gets no offer at all, rather than a wrong one.
 */
function buildIndiaOffer(comic: PublicComicDetail, url: string) {
  const rule = comic.pricingRules.find(
    (p) => p.country.code === "IN" && p.coverType === CoverType.SOFTCOVER
  );
  if (!rule) return null;

  return {
    "@type": "Offer",
    url,
    price: rule.price,
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
  };
}

export default async function ComicDetailLayout({ children, params }: ComicLayoutProps) {
  const { slug } = await params;
  const lookup = await loadComic(slug);

  // A real 404 status for an address that does not exist (and not for an API failure: see loadComic).
  if (lookup.status === "missing") notFound();

  if (lookup.status === "error") return <>{children}</>;

  const { comic } = lookup;

  // An id or an old slug was used: one permanent redirect to the current address. The slug is compared as
  // typed, so a different case or spelling of the right slug is redirected too.
  if (comic.slug && comic.slug !== slug) permanentRedirect(`/comic/${comic.slug}`);

  // Hands the comic the layout already fetched to the page's own query, so the title, description and covers
  // are in the first HTML and the page does not fetch it a second time. The key is the one usePublicComic uses.
  const queryClient = new QueryClient();
  queryClient.setQueryData(["public-comic", slug], comic);

  const url = absoluteUrl(comicHref(comic));
  const offer = buildIndiaOffer(comic, url);
  const images = (comic.coverThumbnailUrls ?? []).map((u) => toImageUrl(u));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Product",
              name: comic.title,
              description: firstNonEmpty(comic.metaDescription, comic.description) ?? DEFAULT_DESCRIPTION,
              url,
              ...(images.length > 0 && { image: images }),
              brand: { "@type": "Brand", name: BRAND_NAME },
              ...(offer && { offers: offer }),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Explore Comics", item: absoluteUrl("/comic") },
                { "@type": "ListItem", position: 3, name: comic.title, item: url },
              ],
            },
          ],
        }}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
    </>
  );
}
