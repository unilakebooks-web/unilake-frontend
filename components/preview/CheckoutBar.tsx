"use client";

import PricingSection from "./PricingSection";
import type { CoverFormat } from "@/hooks/useCheckoutFlow";

/**
 * Floats the checkout section at the bottom of the screen while the customer
 * scrolls through the preview pages.
 *
 * It has no design of its own: it renders the SAME PricingSection as the full
 * block below the last page, in its `compact` size, so the two always look
 * alike. This component only owns the floating — position, and sliding in and
 * out.
 *
 * PreviewViewer decides `visible`: shown while the full section is still
 * below the screen, hidden once it (or anything after it) scrolls into view,
 * so the two are never on screen together.
 *
 * Fully controlled, fed from the same useCheckoutFlow state as the full
 * section, so choosing a cover here is the same choice as choosing it there.
 */
interface CheckoutBarProps {
  comicId: string;
  /** Slides the bar in/out. It stays mounted so the transition can run. */
  visible: boolean;
  failedPageNumbers: number[];
  selectedFormat: CoverFormat | null;
  onSelectFormat: (format: CoverFormat) => void;
  isUpdating: boolean;
  isCheckoutDisabled: boolean;
  onCheckout: () => void;
  /** Resuming an unpaid checkout — see PricingSection. */
  locked?: boolean;
}

export default function CheckoutBar({ visible, ...pricingProps }: CheckoutBarProps) {
  return (
    <div
      // Fixed, not sticky: it has to float over the pages from anywhere in the
      // scroll. translate + opacity rather than mount/unmount so it slides
      // instead of popping.
      //
      // Bottom padding leaves room for the section's 6px offset shadow, which
      // would otherwise be cut off by the screen edge.
      //
      // `inert` while hidden takes the off-screen buttons out of the tab order
      // and away from screen readers, which translate alone would not.
      className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pr-[18px] transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
      inert={!visible}
    >
      <PricingSection {...pricingProps} compact />
    </div>
  );
}
