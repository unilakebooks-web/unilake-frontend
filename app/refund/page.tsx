import type { Metadata } from "next";
import LegalPageView from "@/components/legal/LegalPageView";
import { loadSitePage } from "@/components/legal/loadSitePage";

export const metadata: Metadata = {
  title: "Refund Policy",
};

/** Rendered per request — see the note in app/privacy/page.tsx. */
export const dynamic = "force-dynamic";

export default async function RefundPage() {
  const page = await loadSitePage("REFUND");
  return <LegalPageView page={page} />;
}
