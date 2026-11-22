import type { Metadata } from "next";
import AboutView from "@/components/about/AboutView";
import { fetchPublicSitePage, fetchPublicTeamMembers } from "@/app/actions/public";
import { buildPageMetadata, getSiteSetting, DEFAULT_DESCRIPTION } from "@/lib/seo";
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
 * The About Us page: a designed brand page whose story section is the admin's ABOUT page (same editor and
 * renderer as the privacy page), followed by the team.
 *
 * Until the client has written one, the page shows the brand description from the site settings instead of a
 * 404: the footer links to it from day one. Any failure (no such page,
 * or the backend being down) shows that same fallback, so this page never answers with a 404 or a 500. The
 * page is rendered per request, so the fallback is never cached.
 */
export default async function AboutPage() {
  let page: SitePage;
  // Started now so the team request runs alongside the page request, not after it.
  const membersRequest = fetchPublicTeamMembers();

  try {
    page = await fetchPublicSitePage("ABOUT");
  } catch {
    const setting = await getSiteSetting();
    const description = setting?.brandDescription?.trim() || DEFAULT_DESCRIPTION;

    page = {
      id: null,
      slug: "ABOUT",
      title: "About Us",
      body: `<p>${escapeHtml(description)}</p>`,
      isActive: true,
      createdAt: null,
      updatedAt: null,
    };
  }

  const members = await membersRequest;

  return <AboutView page={page} members={members} />;
}
