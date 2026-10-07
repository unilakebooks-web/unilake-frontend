import type { Metadata } from "next";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

/**
 * Static metadata for the comic catalogue at /comic.
 *
 * Same reason as the [comicId] layout: `app/comic/page.tsx` is a client
 * component and so cannot export metadata itself. This one is static because,
 * per the agreed scope, only the site, comics and blog posts get
 * admin-editable SEO text — everything else gets a sensible fixed title.
 *
 * This does not affect /comic/[comicId]; that route's own layout sits deeper
 * and overrides what is set here.
 */
export const metadata: Metadata = {
  // The template has to be REPEATED here, not just inherited from the root.
  // Setting a title on a layout replaces the title metadata for its whole
  // subtree, which silently dropped the root's "%s | UniLake" template for
  // /comic/[comicId] beneath it — that page rendered a bare title until this
  // was added.
  //
  // `default` is itself run through the ROOT template, so it must NOT repeat
  // the suffix or /comic renders "All Comics | UniLake | UniLake".
  title: {
    default: "All Comics",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Browse every personalized comic book. Pick a story, upload a photo, and see your child become the hero.",
  alternates: { canonical: absoluteUrl("/comic") },
  openGraph: {
    title: "All Comics",
    description:
      "Browse every personalized comic book. Pick a story, upload a photo, and see your child become the hero.",
    url: absoluteUrl("/comic"),
  },
};

export default function ComicCatalogueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
