"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useSessionPreview } from "@/hooks/useSessionPreview";
import PreviewViewer from "@/components/preview/PreviewViewer";
import ComicPreloader from "@/components/comic/ComicPreloader";
import { usePublicComic } from "@/hooks/usePublicComics";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearSession, isValidSessionId, consumeShowPreloader, getSessionBySessionId } from "@/app/lib/session-storage";

function PreviewErrorState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-[#3F3C95] mb-4">{title}</h2>
      <p className="text-gray-600 mb-8">{message}</p>
      <button
        onClick={onAction}
        className="px-8 py-3 bg-[#3F3C95] text-white rounded-full font-medium hover:bg-[#3F3C95]/90 transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export default function PreviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  // The ID comes off the URL, so it can be anything. A malformed one 500s on the server
  // rather than 404ing (§13.1), so screen it here and never make the call at all.
  const sessionIdIsValid = isValidSessionId(resolvedParams.sessionId);
  const sessionId = sessionIdIsValid ? resolvedParams.sessionId : null;

  const [showPreloader, setShowPreloader] = useState(() => {
    return sessionIdIsValid ? consumeShowPreloader(resolvedParams.sessionId) : false;
  });

  const storedSession = sessionIdIsValid
    ? getSessionBySessionId(resolvedParams.sessionId)
    : null;

  const childNameFromStorage = storedSession?.childName ?? "";

  const {
    snapshot,
    isLoading,
    error,
    status,
    pagesReady,
    totalPreviewPages,
    hasNoPreviewPages,
    isExpired,
    isAwaitingPayment,
    isPaid,
    isSentToPrint,
    paidPagesReady,
    totalPaidPages,
    triggerGeneration,
    regeneratePage,
  } = useSessionPreview(sessionId);

  // The preloader renders before the session snapshot lands, so the comic id is
  // taken from localStorage first and only falls back to the snapshot. On a
  // revisit link opened in a different browser there is no stored session, in
  // which case facts simply arrive a moment later with the snapshot.
  //
  // This is the SAME query key PreviewViewer uses, so TanStack serves both from
  // one request rather than two.
  const comicIdForFacts = storedSession?.comicId ?? snapshot?.comicId ?? "";
  const { data: comicForFacts } = usePublicComic(comicIdForFacts);

  const preloaderFacts = useMemo(
    () =>
      (comicForFacts?.facts ?? [])
        .filter((fact) => fact.placement === "PRELOADER")
        .map((fact) => fact.text),
    [comicForFacts?.facts]
  );

  // The preloader is a deliberate stall, and it renders ahead of every error
  // branch below — so without this, someone whose session is already dead would
  // watch a progress bar for 55 seconds before being told so. These are exactly
  // the conditions renderBody() would have rendered an error for.
  //
  // `!isLoading` guards the `!snapshot` term: on the very first render there is
  // no snapshot yet and the fetch is still in flight, which is not a failure.
  // Without it the preloader would be killed instantly on every single load.
  const preloaderInterrupted =
    !sessionIdIsValid ||
    isExpired ||
    hasNoPreviewPages ||
    status === "FAILED" ||
    (!isLoading && !snapshot);

  // Adjusted during render rather than in an effect: this is derived state, and
  // React re-renders immediately without committing the intermediate UI, so the
  // preloader never paints for a frame before the error replaces it.
  //
  // Writing it to state rather than deriving it inline makes the dismissal a
  // one-way door — otherwise a background refetch that recovered `snapshot`
  // would flip the condition back and pull the preloader over an error the user
  // had already started reading.
  if (showPreloader && preloaderInterrupted) {
    setShowPreloader(false);
  }

  // Automatically trigger generation if we just arrived with PHOTO_UPLOADED status.
  // Deliberately NOT depending on `snapshot`: it is a new object on every refetch, so
  // depending on it re-ran this effect constantly. `status` is a primitive derived from
  // it, and the hook itself guarantees /generate is only ever called once per session.
  useEffect(() => {
    if (status !== "PHOTO_UPLOADED") return;
    // Generation is a one-way door (§13.10). Don't walk through it for a comic that has
    // nothing to generate, or for a session whose socket will never connect.
    if (hasNoPreviewPages || isExpired) return;

    triggerGeneration().catch((err) => {
      console.error("Failed to auto-trigger generation:", err);
      toast.error(
        "We couldn't start creating your preview. Please refresh the page to try again."
      );
    });
  }, [status, hasNoPreviewPages, isExpired, triggerGeneration]);

  const handleStartAgain = () => {
    if (snapshot?.comicId) {
      clearSession(snapshot.comicId);
      router.push(`/comic/${snapshot.comicId}`);
    } else {
      router.push("/");
    }
  };

  const renderBody = () => {
    if (showPreloader) {
      return (
        <ComicPreloader
          childName={childNameFromStorage}
          onComplete={() => setShowPreloader(false)}
          facts={preloaderFacts}
        />
      );
    }

    if (!sessionIdIsValid) {
      return (
        <PreviewErrorState
          title="This link isn't valid"
          message="That preview link looks incomplete or damaged. Please start again from the comic page."
          actionLabel="Browse Comics"
          onAction={() => router.push("/")}
        />
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="w-12 h-12 text-[#3F3C95] animate-spin mb-4" />
          <p className="text-xl text-[#3F3C95] font-medium">Loading session...</p>
        </div>
      );
    }

    // Only a total absence of data is fatal. TanStack keeps `error` populated
    // after a failed *background* refetch while `data` stays perfectly valid, so
    // testing `error` here would throw away a working preview every time a poll
    // or a tab-focus refetch blipped. Transient trouble is surfaced as a banner
    // below instead.
    if (!snapshot) {
      return (
        <PreviewErrorState
          title="Oops!"
          message="We couldn't load your session. It may have expired."
          actionLabel="Start Again"
          onAction={handleStartAgain}
        />
      );
    }

    // Checked before anything else about the session, because everything downstream —
    // live updates, regeneration — depends on a socket that will now be refused (§1.2).
    if (isExpired) {
      return (
        <PreviewErrorState
          title="This preview has expired"
          message="Previews are kept for 7 days. Please personalize your comic again — it only takes a moment."
          actionLabel="Start Again"
          onAction={handleStartAgain}
        />
      );
    }

    // Nothing was ever flagged as a free preview page, so no image will ever arrive.
    if (hasNoPreviewPages) {
      return (
        <PreviewErrorState
          title="This comic isn't ready yet"
          message="We can't generate a preview for this comic right now. Please contact support or try a different story."
          actionLabel="Browse Comics"
          onAction={() => router.push("/")}
        />
      );
    }

    // AWAITING_PAYMENT and every sent-to-print status used to replace the
    // viewer with a message screen. Both now fall through to it: an unpaid
    // customer sees what they are paying for (and resumes checkout from the
    // pricing section), and a printed book stays viewable read-only.

    // A session-level FAILED that is not an expiry means every preview page
    // exhausted its retries. This used to replace the whole viewer with
    // "There was an issue with your payment" — wrong on both counts: it is not
    // a payment problem, and FAILED is in the backend's REGENERATABLE_STATUSES,
    // so blocking the viewer removed the one route out. Keep the viewer mounted
    // and say what actually happened.
    return (
      <>
        {status === "FAILED" && !isExpired && (
          <div className="w-full max-w-2xl mx-auto mt-4 px-4">
            <div className="flex items-start gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>
                Our AI server had trouble creating your pages. Hit{" "}
                <strong>Regenerate</strong> on any page that didn&apos;t come
                out — your photo and details are still saved.
              </span>
            </div>
          </div>
        )}

        {isSentToPrint && (
          <div className="w-full max-w-2xl mx-auto mt-24 px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <span className="flex-1">
                <strong>Your book has been sent to print.</strong> These are the
                pages we&apos;re printing.
              </span>
              <button
                onClick={() => router.push("/dashboard/orders")}
                className="shrink-0 font-bold text-emerald-800 underline underline-offset-2 hover:text-emerald-950 cursor-pointer"
              >
                View my order
              </button>
            </div>
          </div>
        )}

        {/* Data is still good — we just couldn't reach the server on the last
            refresh. Say so quietly rather than replacing the whole preview. */}
        {error && (
          <div className="w-full max-w-2xl mx-auto mt-4 px-4">
            <div className="flex items-center justify-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
              <Loader2 size={14} className="animate-spin" />
              Having trouble reaching the server — retrying...
            </div>
          </div>
        )}
        <PreviewViewer
          snapshot={snapshot}
          status={status}
          pagesReady={pagesReady}
          totalPreviewPages={totalPreviewPages}
          onRegenerate={regeneratePage}
          isAwaitingPayment={isAwaitingPayment}
          isPaid={isPaid}
          isSentToPrint={isSentToPrint}
          paidPagesReady={paidPagesReady}
          totalPaidPages={totalPaidPages}
        />
      </>
    );
  };

  return (
    // #F9E3C8, matching ComicPreloader. This wrapper was #F1E0CA while the
    // preloader inside it was #F9E3C8, which drew a visible seam across the
    // screen where the preloader's block ended and the page showed through.
    <div className="min-h-screen bg-[#F9E3C8] flex flex-col">
      {/* Header stays hidden on upward scroll here and only returns at the top,
          so it never slides in over the comic pages while browsing variants. */}
      <HomeHeaderSection showOnlyAtTop />
      <main className="grow flex flex-col items-center justify-center">{renderBody()}</main>
      <Footer />
    </div>
  );
}
