import { Metadata } from "next";
import { loadSessionWithRetry } from "@/app/lib/load-session";
import CheckoutPage from "@/components/checkout/CheckoutPage";
import { redirect } from "next/navigation";
import { isValidSessionId } from "@/app/lib/session-storage";
import SessionLoadError from "@/components/personalize/SessionLoadError";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order to unlock the full story",
  // A customer's in-progress order is private and session-specific — it must
  // never end up in a search index. robots.ts also disallows /personalize; this
  // is the belt-and-braces page-level version.
  robots: { index: false, follow: false },
};

export default async function CheckoutRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = await params;
  const sessionId = resolvedParams.sessionId;

  if (!isValidSessionId(sessionId)) {
    redirect("/");
  }

  // `redirect()` works by THROWING a NEXT_REDIRECT error, so it must never sit
  // inside a try/catch that swallows errors — the catch would eat the redirect
  // and send everyone to the fallback instead. The fetch's own error handling
  // lives inside the helper, and every redirect() stays outside it.
  //
  // Retries matter most on this page of all of them: a one-second backend blip
  // used to throw a customer out of the payment flow onto the homepage.
  const result = await loadSessionWithRetry(sessionId, "checkout");

  // No such session — a real answer, not a blip.
  if (!result.ok && result.reason === "not-found") {
    redirect("/");
  }

  if (!result.ok) {
    return <SessionLoadError message={result.message} />;
  }

  const snapshot = result.snapshot;

  // Already past checkout — send them to the preview page to see the full book.
  // AWAITING_PAYMENT is deliberately allowed through: that is the resume case,
  // where the user closed the Razorpay modal and is coming back to finish.
  if (
    snapshot.status !== "PREVIEW_READY" &&
    snapshot.status !== "AWAITING_PAYMENT" &&
    snapshot.status !== "FAILED"
  ) {
    redirect(`/personalize/${sessionId}/preview`);
  }

  // Must have a coverType picked — checkout prices off it and cannot proceed without it.
  if (!snapshot.coverType) {
    redirect(`/personalize/${sessionId}/preview`);
  }

  return <CheckoutPage sessionId={sessionId} initialSnapshot={snapshot} />;
}
