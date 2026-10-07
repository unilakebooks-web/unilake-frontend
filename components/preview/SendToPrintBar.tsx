"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { frutiger } from "@/app/fonts";

interface SendToPrintBarProps {
  /** Slides the bar in/out. It stays mounted so the transition can run. */
  visible: boolean;
  /** Why the button is disabled, shown in the amber note. Null = clickable. */
  blockReason: string | null;
  busy: boolean;
  onClick: () => void;
}

/**
 * Floats Send to Print at the bottom of the screen while the customer scrolls
 * through their paid book — the post-payment counterpart of CheckoutBar.
 *
 * Same floating behaviour as CheckoutBar (fixed, slides in/out, `inert` while
 * hidden) and the same card look as the compact checkout section: white,
 * rounded, purple border, offset shadow. PreviewViewer decides `visible` with
 * the same rule — shown while the full SendToPrintSection is still below the
 * screen, gone once it scrolls into view — so the two are never on screen
 * together.
 *
 * Presentational: the click, the confirm dialog and the login dialog all come
 * from useSendToPrintFlow, shared with the full section.
 */
export default function SendToPrintBar({
  visible,
  blockReason,
  busy,
  onClick,
}: SendToPrintBarProps) {
  return (
    <div
      // Fixed, not sticky: it has to float over the pages from anywhere in the
      // scroll. Bottom/right padding leaves room for the card's offset shadow,
      // matching CheckoutBar.
      className={`fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pr-[18px] transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
      inert={!visible}
    >
      <div
        className={`${frutiger.className} max-w-[560px] w-full mx-auto py-2.5 px-3 rounded-[20px] border-[3px] border-[#914BBC] shadow-[6px_6px_0px_#403A8B] bg-white flex flex-col items-center`}
      >
        <h2 className="text-sm md:text-lg leading-tight text-center text-black font-bold">
          Happy with your book? Send it to print!
        </h2>

        {blockReason && (
          <div className="mt-2 flex items-start gap-2 w-full max-w-[420px] rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-amber-900">
            <AlertTriangle size={14} className="mt-px shrink-0" />
            <span>{blockReason}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onClick}
          disabled={!!blockReason || busy}
          className="mt-2 w-full max-w-[240px] px-4 py-1.5 bg-[#FFD54A] text-[#3F3C95] rounded-full font-bold text-sm sm:text-base uppercase tracking-wider whitespace-nowrap border-[3px] border-[#3F3C95] shadow-md transition-all flex items-center justify-center gap-2 enabled:cursor-pointer enabled:hover:bg-[#ffcd2b] enabled:hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Sending…
            </>
          ) : (
            "Send to Print"
          )}
        </button>
      </div>
    </div>
  );
}
