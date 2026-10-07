"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";

import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";

interface SessionLoadErrorProps {
  /** Shown under the heading. Keep it plain — a customer is reading this. */
  message?: string;
}

/**
 * Shown when a page could not load its session after retrying.
 *
 * Exists so a transient backend hiccup no longer silently redirects a customer
 * to the homepage mid-flow. Their place is kept; the work is one click away.
 *
 * Retry is `router.refresh()`, which re-runs the server component — including
 * its retries — without a full page reload and without losing history.
 */
export default function SessionLoadError({ message }: SessionLoadErrorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // router.refresh() resolves as soon as it is queued, not when the re-render
  // lands, so on its own the button would flash back to "Try again" while the
  // page is still loading. This keeps the spinner up for the whole transition.
  const [hasRetried, setHasRetried] = useState(false);
  const isRetrying = isPending || hasRetried;

  const handleRetry = () => {
    setHasRetried(true);
    startTransition(() => {
      router.refresh();
      setHasRetried(false);
    });
  };

  return (
    <div
      className={`${hankenGrotesk.className} min-h-[60vh] w-full flex flex-col items-center justify-center px-6 py-16 text-center`}
    >
      <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h1
        className={`${chauPhilomeneOne.className} text-2xl md:text-3xl text-[#3F3C95] mb-3`}
      >
        Something went wrong
      </h1>

      <p className="text-gray-600 max-w-md mb-2">
        We couldn&apos;t load your book just now. This is usually temporary —
        please try again.
      </p>

      {message && (
        <p className="text-xs text-gray-400 max-w-md mb-6">{message}</p>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="px-8 py-3 bg-[#3F3C95] hover:bg-[#4a449d] text-white rounded-full font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isRetrying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Trying again…
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              Try again
            </>
          )}
        </button>

        <Link
          href="/"
          className="px-6 py-3 text-sm font-semibold text-[#3F3C95] hover:underline"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
