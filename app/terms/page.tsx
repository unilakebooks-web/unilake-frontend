import type { Metadata } from "next";
import LegalPageView from "@/components/legal/LegalPageView";
import { loadSitePage } from "@/components/legal/loadSitePage";

export const metadata: Metadata = {
  title: "Terms and Conditions",
};

/** Rendered per request — see the note in app/privacy/page.tsx. */
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  const page = await loadSitePage("TERMS");
  return <LegalPageView page={page} />;
}
