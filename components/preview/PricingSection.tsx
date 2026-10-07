"use client";

import { useCoverPricing } from "@/hooks/useCoverPricing";
import { frutiger, poppins } from "@/app/fonts";
import Image from "next/image";

import { Loader2 } from "lucide-react";
import { resolveMrp } from "@/lib/utils";
import type { CoverFormat } from "@/hooks/useCheckoutFlow";

/**
 * The cover-format selector and checkout call to action. Rendered twice on the
 * preview page: full size once below the last comic page, and `compact` inside
 * CheckoutBar, which floats at the bottom of the screen while the pages scroll.
 *
 * Presentational and fully controlled: selection, in-flight state and the
 * login modal live once in useCheckoutFlow, shared with CheckoutBar, so the
 * two always agree about what the customer picked.
 */
/**
 * The close-up shown in each option's picture box: the book's corner, where
 * the spine (hardcover) or the thin page edge (softcover) is visible — the
 * detail that tells the two apart at a glance.
 *
 * Both are purpose-shot close-ups at 2:1, the same shape as the picture box
 * (`aspect-[2/1]` below), so each image is shown whole — nothing cropped and
 * no empty bands.
 *
 * ⚠️ new_softcover.png is actually a JPEG despite its extension. Browsers and
 * the Next.js image optimizer detect the real format from the file, so it
 * works as-is; just don't rely on the extension if processing it elsewhere.
 */
const COVER_OPTIONS = {
  SOFTCOVER: {
    name: "Softcover",
    tagline: "Lightweight",
    src: "/assets/home_page/new_softcover.png", // 615x307
  },
  HARDCOVER: {
    name: "Hardcover",
    tagline: "Long Lasting",
    src: "/assets/home_page/hardcover.jpeg", // 750x375
  },
} as const;

/**
 * Every size in the section, in two sets: the full section below the last page,
 * and the compact copy that floats at the bottom of the screen (CheckoutBar).
 *
 * Only sizes differ — same structure, same text, same colours — so the floating
 * bar is the same design, just smaller. One notable difference: the full
 * section stacks its cards below md; the compact one keeps them side by side
 * at every width, shrunk to fit a phone, so it stays short enough to float.
 *
 * Complete class strings, never assembled from pieces: Tailwind only generates
 * classes it can find written out in full in the source.
 */
const SIZES = {
  full: {
    container:
      "max-w-[640px] py-6 px-5 rounded-[28px] border-[4px] shadow-[12px_12px_0px_#403A8B] mt-8 mb-12",
    heading: "text-xl md:text-[28px] leading-tight mb-1",
    row: "flex-col md:flex-row gap-3 md:gap-4 mb-5 mt-4",
    card: "gap-3 px-3 py-2.5 rounded-[18px] max-w-[280px]",
    cardSelected: "border-[4px]",
    tagline: "text-[11px] whitespace-nowrap mb-1",
    picture: "w-[104px] rounded-lg",
    right: "gap-1.5",
    name: "text-lg tracking-wide",
    mrp: "text-sm mb-1",
    price: "text-2xl",
    choose: "text-xs",
    warning: "mb-4 px-4 py-2.5 text-xs",
    button:
      "px-5 py-2.5 text-base max-w-[260px] shadow-[0px_4px_0px_#BF8902,0px_10px_20px_rgba(62,65,155,0.5)] active:translate-y-[4px]",
    spinner: 20,
  },
  compact: {
    container:
      "max-w-[560px] py-2.5 px-3 rounded-[20px] border-[3px] shadow-[6px_6px_0px_#403A8B]",
    heading: "text-sm md:text-lg leading-tight",
    // Phone sizes (unprefixed) are budgeted for a 360px-wide screen: after the
    // bar's and section's padding, each card gets ~117px, split into a 44px
    // picture, a 6px gap and ~67px for "Hardcover" / "₹ 1,600". The tagline
    // may wrap to two lines so it never widens the picture column.
    row: "flex-row gap-1 sm:gap-3 mb-2.5 mt-2",
    card: "flex-1 min-w-0 gap-1.5 sm:gap-2.5 px-1.5 sm:px-2.5 py-1.5 rounded-xl max-w-[240px]",
    cardSelected: "border-[3px]",
    tagline: "text-[9px] sm:text-[10px] sm:whitespace-nowrap text-center mb-0.5",
    picture: "w-[44px] sm:w-[84px] rounded-md",
    right: "gap-1",
    name: "text-[11px] tracking-normal sm:text-base sm:tracking-wide",
    mrp: "text-[10px] sm:text-xs mb-0.5",
    price: "text-sm sm:text-lg",
    choose: "text-[9px] sm:text-[10px]",
    warning: "mb-2 px-3 py-1 text-[11px]",
    button:
      "px-4 py-1.5 text-sm max-w-[240px] shadow-[0px_3px_0px_#BF8902,0px_6px_14px_rgba(62,65,155,0.4)] active:translate-y-[3px]",
    spinner: 16,
  },
} as const;

interface PricingSectionProps {
  comicId: string;
  /**
   * The smaller copy used by the floating CheckoutBar. Same design, compact
   * sizes, no outer margins (the bar positions it). Defaults to the full size.
   */
  compact?: boolean;
  /**
   * Preview pages that exhausted every retry and have no finished variant.
   * Non-empty blocks checkout: a customer must not be able to pay for a book
   * with a page that does not exist, and the fix is free — regenerate it.
   */
  failedPageNumbers: number[];
  selectedFormat: CoverFormat | null;
  onSelectFormat: (format: CoverFormat) => void;
  /** Drives the spinner. Shared, so every block reflects one submission. */
  isUpdating: boolean;
  isCheckoutDisabled: boolean;
  onCheckout: () => void;
  /**
   * Resuming an unpaid checkout (session at AWAITING_PAYMENT). The cover was
   * chosen and priced when checkout began and the backend has locked it, so the
   * other option is disabled and the button resumes payment instead.
   */
  locked?: boolean;
}

export default function PricingSection({
  comicId,
  compact = false,
  failedPageNumbers,
  selectedFormat,
  onSelectFormat,
  isUpdating,
  isCheckoutDisabled,
  onCheckout,
  locked = false,
}: PricingSectionProps) {
  const { isLoaded, softcoverRule, hardcoverRule, currencySymbol } =
    useCoverPricing(comicId);

  if (!isLoaded) return null;

  const s = compact ? SIZES.compact : SIZES.full;

  /**
   * Price block for one cover option: struck-through MRP above the price.
   * "N/A" when the comic isn't priced for the selected country; the MRP line
   * is dropped when there is no real discount to show.
   */
  const renderPrice = (rule: typeof softcoverRule) => {
    if (!rule) return <span className={`${s.price} font-bold`}>N/A</span>;

    const { price, mrp, showMrp } = resolveMrp(rule);

    return (
      <div className="flex flex-col items-center">
        {showMrp && (
          <span className={`${s.mrp} text-gray-500 line-through leading-none whitespace-nowrap`}>
            {currencySymbol} {mrp.toLocaleString("en-IN")}
          </span>
        )}
        <span className={`${s.price} font-bold leading-none whitespace-nowrap`}>
          {currencySymbol} {price.toLocaleString("en-IN")}
        </span>
      </div>
    );
  };

  /**
   * One selectable cover option. Tagline + close-up on the left, name + price
   * on the right. A real <button> so it is reachable and selectable from the
   * keyboard; `aria-pressed` tells screen readers which one is chosen.
   */
  const renderOption = (format: CoverFormat, rule: typeof softcoverRule) => {
    const option = COVER_OPTIONS[format];
    const isSelected = selectedFormat === format;
    // Locked: the chosen cover stays shown as selected; the other is inert.
    const isDisabled = !rule || (locked && !isSelected);

    return (
      <button
        type="button"
        onClick={() => !isDisabled && !locked && onSelectFormat(format)}
        disabled={isDisabled}
        aria-pressed={isSelected}
        className={`${s.card} grid grid-cols-[auto_1fr] items-center w-full text-black transition-all ${
          isDisabled
            ? "opacity-50 cursor-not-allowed border border-gray-200"
            : isSelected
              ? `${s.cardSelected} border-[#914BBC] scale-[1.02] ${locked ? "cursor-default" : "cursor-pointer"}`
              : "border border-black hover:border-gray-500 cursor-pointer"
        }`}
      >
        {/* Left: tagline over the close-up picture. */}
        <div className="flex flex-col items-center">
          <span className={`${s.tagline} leading-tight`}>{option.tagline}</span>
          <div className={`${s.picture} relative aspect-[2/1] border border-black/70 overflow-hidden bg-white`}>
            <Image
              src={option.src}
              alt={`${option.name} book`}
              fill
              // The box is 104px wide at most (full section), 44–84px in the
              // floating bar; this lets the optimizer serve a sharp 2x copy.
              sizes="104px"
              className="object-cover"
            />
          </div>
        </div>

        {/* Right: name over price. */}
        <div className={`${s.right} flex flex-col items-center min-w-0`}>
          <span className={`${s.name} font-bold leading-none`}>{option.name}</span>
          {renderPrice(rule)}
        </div>
      </button>
    );
  };

  // Still needed locally for the warning banner below. The checkout guard that
  // used the same value now lives in useCheckoutFlow, which computes it from
  // the same prop.
  //
  // Never shown when locked: it tells the customer to regenerate, which the
  // backend refuses at AWAITING_PAYMENT.
  const hasFailedPages = !locked && failedPageNumbers.length > 0;

  return (
    // Full: max-w-[640px] fits two ~280px option cards plus "Choose" in one row
    // from md up; below md the cards stack. Compact: see SIZES.
    //
    // Frutiger is set ONCE here and inherited by everything inside — heading,
    // cards, prices and warning. Only its two real weights are used:
    // font-bold for the heading, cover names, prices and "Choose"; regular for
    // taglines, MRP and helper text (see app/fonts.ts). The button is the one
    // exception and sets Poppins itself.
    <div className={`${frutiger.className} ${s.container} w-full mx-auto flex flex-col items-center bg-[#FFFFFF] border-[#914BBC] relative`}>
      <h2 className={`${s.heading} text-center text-black font-bold`}>
        {locked
          ? "Complete Your Payment to Unlock the Full Story"
          : "Complete Your Order to Unlock the Full Story"}
      </h2>

      {locked && (
        <p className={`${s.choose} mt-1 text-center text-gray-500`}>
          Cover was chosen at checkout
        </p>
      )}

      <div className={`${s.row} flex items-center justify-center w-full`}>
        {renderOption("SOFTCOVER", softcoverRule)}

        <span className={`${s.choose} font-bold text-black whitespace-nowrap`}>Choose</span>

        {renderOption("HARDCOVER", hardcoverRule)}
      </div>

      {hasFailedPages && (
        <div
          className={`${s.warning} w-full max-w-[400px] rounded-2xl border border-amber-300 bg-amber-50 text-center text-amber-900`}
        >
          <span className="font-bold">
            {failedPageNumbers.length === 1
              ? `Page ${failedPageNumbers[0]} couldn't be created.`
              : `Pages ${failedPageNumbers.join(", ")} couldn't be created.`}
          </span>{" "}
          Scroll up and hit Regenerate on {failedPageNumbers.length === 1 ? "it" : "them"} before checking out.
        </div>
      )}

      <button
        onClick={onCheckout}
        disabled={isCheckoutDisabled}
        // Solid #3E419B rather than the old two-stop gradient: a single
        // specified colour cannot be expressed as a gradient without inventing
        // a second shade. Hover uses brightness rather than a hand-picked hex
        // for the same reason — and matches how the personalize form's button
        // handles its hover. Bottom edge and drop shadow are #BF8902 and a
        // tint of the new blue, so nothing purple or yellow is left behind.
        // Narrower button AND larger text pull against each other, so the
        // horizontal padding drops from px-6 to px-5 to buy back the room.
        // whitespace-nowrap is the safety net: at 20 uppercase characters this
        // is close enough to the limit that a narrow viewport could otherwise
        // break "CONTINUE TO CHECKOUT" across two lines, which looks broken in
        // a pill. Narrow this further and the text size has to come back down.
        // Poppins ExtraBold, not Frutiger: the heavy rounded call to action is
        // set on the button itself so it overrides the container's Frutiger.
        className={`${poppins.className} ${s.button} bg-[#3E419B] hover:brightness-110 text-white rounded-full font-extrabold uppercase tracking-wide whitespace-nowrap transition-all w-full border-2 border-[#1e1c4a] active:shadow-[0px_0px_0px_#BF8902,0px_4px_10px_rgba(62,65,155,0.5)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
      >
        {isUpdating ? (
          <>
            <Loader2 className="animate-spin" size={s.spinner} />
            Updating...
          </>
        ) : locked ? (
          "COMPLETE PAYMENT"
        ) : (
          "CONTINUE TO CHECKOUT"
        )}
      </button>

      {/* No LoginModal here. This section and CheckoutBar both start checkout,
          and one modal per component would mount two dialogs for a single
          login. PreviewViewer renders exactly one, driven by the shared
          useCheckoutFlow state. */}
    </div>
  );
}
