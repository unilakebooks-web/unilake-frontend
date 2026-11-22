import type { Metadata } from "next";
import LegalPageView from "@/components/legal/LegalPageView";
import { loadSitePage } from "@/components/legal/loadSitePage";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    slug: "TERMS",
    path: "/terms",
    title: "Terms and Conditions",
    description:
      "The terms that apply when you use UniLake and order a personalized storybook.",
  });
}

/** Rendered per request - see the note in app/privacy/page.tsx. */
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const page = await loadSitePage("TERMS");
  return <LegalPageView page={page} />;
}
