import { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadSessionWithRetry } from "@/app/lib/load-session";
import { isValidSessionId } from "@/app/lib/session-storage";
import NewPhotoPageShell from "@/components/personalize/NewPhotoPageShell";
import SessionLoadError from "@/components/personalize/SessionLoadError";

export const metadata: Metadata = {
  title: "Upload a new photo",
  description: "Start again with a different photo of your child",
  // This URL carries a child's name and a parent's email once the form loads.
  // robots.ts already disallows /personalize; this is the page-level version,
  // matching the checkout route.
  robots: { index: false, follow: false },
};

export default async function NewPhotoRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const resolvedParams = await params;
  const sessionId = resolvedParams.sessionId;

  if (!isValidSessionId(sessionId)) {
    redirect("/");
  }

  // Retries transient failures — a restarting backend or a database waking from
  // sleep. `redirect()` works by THROWING, so it stays outside the fetch's own
  // error handling, which lives inside the helper.
  const result = await loadSessionWithRetry(sessionId, "new-photo");

  // No such session. A real answer, not a blip — nothing to retry.
  if (!result.ok && result.reason === "not-found") {
    redirect("/");
  }

  // Reachability problem that survived every retry. Keep the customer here with
  // a way back in, rather than dumping them on the homepage with no
  // explanation and no idea what happened.
  if (!result.ok) {
    return <SessionLoadError message={result.message} />;
  }

  const snapshot = result.snapshot;

  // PREVIEW_READY only. Before that there is nothing to be dissatisfied with
  // yet, and from AWAITING_PAYMENT onward the customer has committed — letting
  // a hand-typed URL start a fresh unpaid session from there would strand the
  // order they already have.
  if (snapshot.status !== "PREVIEW_READY") {
    redirect(`/personalize/${sessionId}/preview`);
  }

  // An expired session can still be read over REST, but a new session started
  // from it is fine — only the OLD one is dead. Nothing to guard here; the new
  // session gets its own 7-day window.

  return <NewPhotoPageShell previousSession={snapshot} />;
}
