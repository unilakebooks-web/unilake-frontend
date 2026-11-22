import type { Metadata } from "next";
import LegalPageView from "@/components/legal/LegalPageView";
import { loadSitePage } from "@/components/legal/loadSitePage";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    slug: "REFUND",
    path: "/refund",
    title: "Refund Policy",
    description:
      "The UniLake refund policy for personalized storybook orders.",
  });
}

/** Rendered per request - see the note in app/privacy/page.tsx. */
export const dynamic = "force-dynamic";

export default async function RefundPage() {
  const page = await loadSitePage("REFUND");
  return <LegalPageView page={page} />;
}
