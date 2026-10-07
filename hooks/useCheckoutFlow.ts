"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateSession, attachUser } from "@/app/actions/session";
import { useAuth } from "@/app/hooks/useAuth";
import { useOrdersPaused } from "@/hooks/useSiteSettings";
import { ORDERS_PAUSED_MESSAGE } from "@/lib/storeStatus";
import type { SessionSnapshot } from "@/app/types/session";

export type CoverFormat = "SOFTCOVER" | "HARDCOVER";

interface UseCheckoutFlowArgs {
  sessionId: string;
  snapshot: SessionSnapshot;
  /**
   * Preview pages that exhausted every retry and have no finished variant.
   * Non-empty blocks checkout: a customer must not be able to pay for a book
   * with a page that does not exist, and the fix is free — regenerate it.
   */
  failedPageNumbers: number[];
}

/**
 * Owns the cover-selection and checkout flow for one session.
 *
 * This lives in a hook rather than inside PricingSection because the preview
 * page now renders that section several times — once after every third comic
 * page, plus the closing one. With the state inside the component, each copy
 * had its own `selectedFormat`, so choosing Softcover on one block and
 * scrolling to the next showed nothing selected; each copy also mounted its own
 * LoginModal. Calling this once and feeding every block from it means there is
 * a single selection, a single in-flight flag, and a single modal.
 *
 * `isUpdating` is shared deliberately: it disables every checkout button at
 * once, so a second block cannot start a duplicate submission while the first
 * is still running.
 */
export function useCheckoutFlow({
  sessionId,
  snapshot,
  failedPageNumbers,
}: UseCheckoutFlowArgs) {
  const [pickedFormat, setPickedFormat] = useState<CoverFormat | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const ordersPaused = useOrdersPaused();
  const router = useRouter();

  // Resume: checkout was already started, so an unpaid Order + Razorpay order
  // exist, priced for the cover chosen back then. The backend has locked
  // coverType since (a PATCH 409s), so the cover is read off the session and
  // cannot be changed here — derived, not stored, so it can never drift.
  const isResume = snapshot.status === "AWAITING_PAYMENT";
  const selectedFormat: CoverFormat | null = isResume
    ? snapshot.coverType
    : pickedFormat;
  const setSelectedFormat = useCallback(
    (format: CoverFormat) => {
      if (!isResume) setPickedFormat(format);
    },
    [isResume]
  );

  const hasFailedPages = failedPageNumbers.length > 0;

  const handleCheckout = useCallback(async () => {
    if (isResume) {
      // None of the fresh-checkout guards apply when resuming:
      //   - orders paused: the backend lets an existing unpaid order finish by
      //     design, so blocking here would strand someone mid-payment;
      //   - failed pages: checkout was already gated on them, and regeneration
      //     is refused at AWAITING_PAYMENT, so the customer could not fix it;
      //   - the coverType PATCH: locked, and already set.
      if (authLoading) return;
      if (!isAuthenticated) {
        setShowLoginModal(true);
        return;
      }
      setIsUpdating(true);
      router.push(`/personalize/${sessionId}/checkout`);
      return;
    }

    // Store closed — stop here, on this page.
    //
    // Deliberately the FIRST thing in this function, before the cover-type
    // PATCH, before the login modal, before anything touches the network.
    // There is no point saving a format, asking someone to log in, or walking
    // them through an address form for an order that cannot be placed.
    //
    // This is a courtesy, not the enforcement. The backend rejects checkout on
    // its own, so a stale flag here (the public settings query caches for five
    // minutes) can only mean someone gets to the address page and is stopped a
    // step later — never that an order goes through.
    if (ordersPaused) {
      toast.error(ORDERS_PAUSED_MESSAGE);
      return;
    }

    // Guarded here as well as on the disabled button: the button can be
    // re-enabled from devtools, and this is the path to a real payment.
    if (hasFailedPages) {
      toast.error(
        "Some pages could not be created. Please regenerate them before checking out."
      );
      return;
    }

    if (!selectedFormat) {
      toast.error("Please select a cover format");
      return;
    }

    if (authLoading) return;

    setIsUpdating(true);
    try {
      // 1. PATCH coverType
      await updateSession(sessionId, { coverType: selectedFormat });

      // 2. Check auth
      if (!isAuthenticated) {
        setShowLoginModal(true);
        setIsUpdating(false);
        return;
      }

      // 3. Attach user if missing
      if (!snapshot.userId) {
        await attachUser(sessionId);
      }

      // 4. Navigate to checkout
      router.push(`/personalize/${sessionId}/checkout`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update order details. Please try again.");
      setIsUpdating(false);
    }
  }, [
    isResume,
    ordersPaused,
    hasFailedPages,
    selectedFormat,
    authLoading,
    sessionId,
    isAuthenticated,
    snapshot.userId,
    router,
  ]);

  return {
    selectedFormat,
    setSelectedFormat,
    isResume,
    isUpdating,
    hasFailedPages,
    // Every checkout button shares this, so one in-flight submission disables
    // all of them rather than just the block that was clicked.
    isCheckoutDisabled:
      isUpdating || authLoading || (!isResume && hasFailedPages),
    handleCheckout,
    showLoginModal,
    setShowLoginModal,
  };
}
