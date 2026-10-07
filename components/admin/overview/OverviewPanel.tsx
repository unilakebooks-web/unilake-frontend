"use client";

import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getErrorMessage } from "@/lib/utils";

/**
 * The card every overview band sits in, plus its loading and error states.
 *
 * Exists because the page runs three independent queries and each band has to
 * handle its own failure — without a shared shell that is the same twenty lines
 * of skeleton-and-retry markup repeated five times, drifting apart on the first
 * edit.
 *
 * Hand-rolled rather than shadcn's Card: every other admin screen uses this
 * exact treatment (bg-white/70 + backdrop-blur + rounded-3xl + the purple hairline
 * border), and the overview should not be the one page that looks different.
 * `components/ui/card.tsx` exists on disk only because the chart component
 * listed it as a registry dependency; nothing imports it.
 */
export function OverviewPanel({
  title,
  icon: Icon,
  action,
  isLoading,
  error,
  onRetry,
  skeletonRows = 3,
  className,
  children,
}: {
  title?: string;
  icon?: LucideIcon;
  /** Rendered at the right of the header — a toggle, a "View all" link. */
  action?: React.ReactNode;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  skeletonRows?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm",
        className
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 px-5 sm:px-6 pt-5 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="w-4 h-4 text-[#914A8C] shrink-0" />}
            <h2 className="text-[11px] font-bold text-[#914A8C] uppercase tracking-wider truncate">
              {title}
            </h2>
          </div>
          {action}
        </header>
      )}

      <div className="px-5 sm:px-6 pb-5">
        {isLoading ? (
          <div className="space-y-3 py-1">
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-10 w-full rounded-xl bg-[#F8E7D2]/70"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <p className="font-bold text-red-800 mb-1">Couldn&apos;t load this</p>
            <p className="text-sm text-red-600 mb-4 max-w-sm">
              {getErrorMessage(error, "Network error")}
            </p>
            {onRetry && (
              <Button
                onClick={onRetry}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Try Again
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
