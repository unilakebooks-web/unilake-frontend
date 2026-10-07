"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

interface SendToPrintSectionProps {
  /** Why the button is disabled, shown in the amber note. Null = clickable. */
  blockReason: string | null;
  /** The request (or the redirect after it) is in flight. */
  busy: boolean;
  onClick: () => void;
}

/**
 * The full Send to Print block below the last comic page.
 *
 * Presentational: state, the confirm dialog and the login dialog live once in
 * useSendToPrintFlow (called in PreviewViewer), shared with the floating
 * SendToPrintBar, so both buttons always behave identically.
 */
export default function SendToPrintSection({
  blockReason,
  busy,
  onClick,
}: SendToPrintSectionProps) {
  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4 flex flex-col items-center border-t border-gray-200 mt-12">
      {blockReason && (
        <div className="mb-6 flex items-start gap-3 max-w-md w-full rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{blockReason}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={!!blockReason || busy}
        className="px-12 py-4 bg-[#FFD54A] text-[#3F3C95] rounded-full font-bold text-xl md:text-2xl uppercase tracking-wider shadow-lg transition-all w-full max-w-md border-[3px] border-[#3F3C95] flex items-center justify-center gap-3 enabled:cursor-pointer enabled:hover:bg-[#ffcd2b] enabled:hover:shadow-xl enabled:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" /> Sending…
          </>
        ) : (
          "Send to Print"
        )}
      </button>
    </div>
  );
}
