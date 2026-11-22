import type { Metadata } from "next";
import { buildPageMetadata, SITE_NAME } from "@/lib/seo";

/**
 * Metadata for the comic catalogue at /comic: the admin's SEO text for the page, else a fixed title.
 *
 * Same reason as the [slug] layout: the catalogue itself is a client component
 * (components/comic/ComicIndex.tsx) and so cannot export metadata.
 *
 * This does not affect /comic/[slug]; that route's own layout sits deeper
 * and overrides what is set here.
 */
export async function generateMetadata(): Promise<Metadata> {
  const meta = await buildPageMetadata({
    slug: "COMICS",
    path: "/comic",
    title: "All Comics",
    description:
      "Browse every personalized comic book. Pick a story, upload a photo, and see your child become the hero.",
  });

  return {
    ...meta,
    // The template has to be REPEATED here, not just inherited from the root.
    // Setting a title on a layout replaces the title metadata for its whole
    // subtree, which silently dropped the root's "%s | UniLake" template for
    // /comic/[slug] beneath it - that page rendered a bare title until this
    // was added.
    //
    // `default` is itself run through the ROOT template, so it must NOT repeat
    // the suffix or /comic renders "All Comics | UniLake | UniLake".
    title: {
      default: meta.title as string,
      template: `%s | ${SITE_NAME}`,
    },
  };
}

export default function ComicCatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
