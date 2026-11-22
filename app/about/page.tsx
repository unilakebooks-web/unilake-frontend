import type { Metadata } from "next";
import LegalPageView from "@/components/legal/LegalPageView";
import { fetchPublicSitePage } from "@/app/actions/public";
import { buildPageMetadata, getSiteSetting, DEFAULT_DESCRIPTION } from "@/lib/seo";
import { getErrorCode } from "@/lib/utils";
import type { SitePage } from "@/app/types/sitePage";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    slug: "ABOUT",
    path: "/about",
    title: "About Us",
    description:
      "About UniLake: who we are and how we turn your child into the hero of their own printed comic book.",
  });
}

/** Rendered per request - see the note in app/privacy/page.tsx. */
export const dynamic = "force-dynamic";

/** The brand text is admin-typed plain text, so it is escaped before it goes into the page's HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The About Us page: the admin's ABOUT page (same editor and renderer as the privacy page).
 *
 * Until the client has written one, the page shows the brand description from the site settings and a link
 * to the team, instead of a 404: the header and footer link to it from day one. Only a genuine "no such
 * page" falls back; any other error is rethrown like on the other site pages, so a backend outage is not
 * published as if it were the About text.
 */
export default async function AboutPage() {
  let page: SitePage;

  try {
    page = await fetchPublicSitePage("ABOUT");
  } catch (error: unknown) {
    if (getErrorCode(error) !== "NOT_FOUND") throw error;

    const setting = await getSiteSetting();
    const description = setting?.brandDescription?.trim() || DEFAULT_DESCRIPTION;

    page = {
      id: null,
      slug: "ABOUT",
      title: "About Us",
      body: `<p>${escapeHtml(description)}</p><p><a href="/team">Meet the team behind UniLake</a></p>`,
      isActive: true,
      createdAt: null,
      updatedAt: null,
    };
  }

  return <LegalPageView page={page} />;
}
