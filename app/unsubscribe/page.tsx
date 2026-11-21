import type { Metadata } from "next";
import UnsubscribeView from "@/components/unsubscribe/UnsubscribeView";

// The link in a bulk email carries a private token: keep the page out of search results and keep the token
// out of any Referer header.
export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string | string[] }>;
}) {
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : "";
  return <UnsubscribeView token={token} />;
}
