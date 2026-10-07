import type { Metadata } from "next";
import LegalPageView from "@/components/legal/LegalPageView";
import { loadSitePage } from "@/components/legal/loadSitePage";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

/**
 * Rendered per request, not at build time.
 *
 * Without this Next prerenders the route during `next build`, which would both
 * fail the build whenever the API is unreachable and freeze the policy text
 * into the bundle — publishing an edit from the admin panel would not show up
 * until the next deploy.
 */
export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const page = await loadSitePage("PRIVACY");
  return <LegalPageView page={page} />;
}
