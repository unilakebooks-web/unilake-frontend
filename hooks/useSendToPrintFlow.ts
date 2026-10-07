"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SendToPrintSelection } from "@/app/types/session";
import { useSendToPrint } from "@/hooks/useSendToPrint";
import { clearSession } from "@/app/lib/session-storage";

/** Shown when Send to Print is clicked before every page has finished. */
const STILL_GENERATING_MESSAGE =
  "Your comic pages are still being generated, so we can't send them to print yet. Please wait patiently for the generation to finish.";

/** "7" | "7 and 12" | "7, 12 and 18" */
function formatPageList(pages: number[]): string {
  if (pages.length === 1) return String(pages[0]);
  return `${pages.slice(0, -1).join(", ")} and ${pages[pages.length - 1]}`;
}

interface UseSendToPrintFlowArgs {
  sessionId: string;
  comicId: string;
  selections: SendToPrintSelection[];
  /**
   * Pages with no SD_READY variant to print. Only meaningful once generation
   * has finished — while it runs, a page still being made has no ready variant
   * either, so this list is ignored whenever `isGenerating` is true.
   */
  blockedPages: number[];
  /**
   * The paid pages are still being created (first run, or a regeneration).
   * The button stays clickable; a click explains the wait instead of opening
   * the confirm dialog.
   */
  isGenerating: boolean;
  pageCountMismatch: boolean;
}

/**
 * Everything behind the Send to Print button, in ONE place.
 *
 * The button appears twice on the preview page — the full section below the
 * last page and the floating SendToPrintBar — so, exactly like
 * useCheckoutFlow, this is called once in PreviewViewer and both copies read
 * the same state. That is what makes them agree on what's blocked and what's
 * in flight, and lets a single confirm dialog and a single login dialog serve
 * both.
 */
export function useSendToPrintFlow({
  sessionId,
  comicId,
  selections,
  blockedPages,
  isGenerating,
  pageCountMismatch,
}: UseSendToPrintFlowArgs) {
  const router = useRouter();
  const { mutateAsync, isPending } = useSendToPrint(sessionId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Held true through the redirect so the button never flicks back to "ready"
  // between the request resolving and the new route painting.
  const [isRedirecting, setIsRedirecting] = useState(false);

  const busy = isPending || isRedirecting;

  // Reasons that DISABLE the button, each shown in the amber note. Order
  // matters: the data problem is unfixable by the user, so it outranks the one
  // they can act on.
  //
  // Generation in progress is deliberately NOT one of them — the button stays
  // clickable and explains itself (see handleClick). Failed pages only count
  // once generation has finished, since until then "no ready image yet" just
  // means "not made yet".
  const blockReason = pageCountMismatch
    ? "This book's pages don't match its configured length, so we can't send it to print. Please contact support — we'll sort it out."
    : !isGenerating && blockedPages.length > 0
      ? `${blockedPages.length === 1 ? "Page" : "Pages"} ${formatPageList(blockedPages)} didn't come out right. Please regenerate ${blockedPages.length === 1 ? "it" : "them"} before sending your book to print.`
      : null;

  const handleClick = () => {
    if (isGenerating) {
      // Fixed id: repeated clicks (from either button) replace the toast
      // instead of stacking copies.
      toast.info(STILL_GENERATING_MESSAGE, { id: "send-to-print-generating" });
      return;
    }
    setErrorMessage(null);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await mutateAsync(selections);

      // The session is finished and locked — drop the local copy so the user
      // isn't pulled back into personalizing a book they've committed to print.
      clearSession(comicId);
      setIsRedirecting(true);
      toast.success("Your book is on its way to print!");
      router.push("/dashboard/orders");
    } catch (err) {
      const { code, message } = (err ?? {}) as { code?: string; message?: string };

      if (code === "UNAUTHORIZED") {
        setConfirmOpen(false);
        setLoginOpen(true);
        return;
      }

      // The session moved underneath us — another tab sent it, or the status
      // drifted. The backend's message is already written for the customer.
      if (code === "CONFLICT") {
        setErrorMessage(message ?? "This book has already been sent to print.");
        return;
      }

      setErrorMessage(message ?? "We couldn't send your book to print. Please try again.");
    }
  };

  return {
    blockReason,
    busy,
    handleClick,
    handleConfirm,
    confirmOpen,
    setConfirmOpen,
    loginOpen,
    setLoginOpen,
    errorMessage,
    pageCount: selections.length,
  };
}
