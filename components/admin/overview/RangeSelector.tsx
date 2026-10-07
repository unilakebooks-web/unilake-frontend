"use client";

import { STATS_RANGES, type StatsRange } from "@/app/types/stats";
import { cn } from "@/lib/utils";

/**
 * 7 days / 30 days / All time.
 *
 * A dashboard-scale sibling of the SegmentedControl in the bubble mapper rather
 * than a reuse of it: that one is 11px type built for a cramped sidebar and
 * requires a `label`, both of which read as undersized next to a KPI row.
 *
 * Drives two of the page's three queries — content-health has no range and must
 * not refetch when this changes.
 */
export function RangeSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: StatsRange;
  onChange: (range: StatsRange) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className="inline-flex items-center gap-1 bg-white/70 backdrop-blur-sm p-1 rounded-2xl border border-[#914A8C]/15 shadow-sm"
    >
      {STATS_RANGES.map((range) => {
        const isActive = range.value === value;

        return (
          <button
            key={range.value}
            type="button"
            disabled={disabled}
            aria-pressed={isActive}
            onClick={() => onChange(range.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isActive
                ? "bg-[#914A8C] text-white shadow-sm"
                : "text-[#914A8C]/70 hover:bg-[#914A8C]/10 hover:text-[#914A8C]"
            )}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
