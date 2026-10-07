"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A headline number with a label and one supporting line.
 *
 * This is a stat tile rather than a one-bar chart on purpose: a handful of
 * current values is a KPI row, and drawing a bar for a single number adds
 * nothing a reader can use.
 *
 * `tone="alert"` is reserved for the needs-attention tile and only when the
 * count is non-zero — a permanently red tile stops meaning anything.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
  href,
  isLoading = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "alert";
  href?: string;
  isLoading?: boolean;
}) {
  const isAlert = tone === "alert";

  const body = (
    <div
      className={cn(
        "h-full rounded-3xl border shadow-sm backdrop-blur-sm p-5 transition-colors",
        isAlert
          ? "bg-red-50/90 border-red-200"
          : "bg-white/70 border-[#914A8C]/15",
        href && "hover:border-[#914A8C]/40 cursor-pointer"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon
          className={cn(
            "w-4 h-4 shrink-0",
            isAlert ? "text-red-600" : "text-[#914A8C]"
          )}
        />
        <span
          className={cn(
            "text-[11px] font-bold uppercase tracking-wider truncate",
            isAlert ? "text-red-700" : "text-[#914A8C]"
          )}
        >
          {label}
        </span>
      </div>

      {isLoading ? (
        <>
          <Skeleton className="h-8 w-28 rounded-lg bg-[#F8E7D2]/80 mb-2" />
          <Skeleton className="h-3 w-20 rounded bg-[#F8E7D2]/60" />
        </>
      ) : (
        <>
          {/* Text wears text tokens, never a series colour — the icon above
              carries the identity. */}
          <div
            className={cn(
              "text-3xl font-black tracking-tight tabular-nums truncate",
              isAlert ? "text-red-900" : "text-neutral-900"
            )}
          >
            {value}
          </div>
          {sub && (
            <div
              className={cn(
                "text-xs font-medium mt-1 truncate",
                isAlert ? "text-red-700" : "text-neutral-500"
              )}
            >
              {sub}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (href && !isLoading) {
    return (
      <Link href={href} className="block h-full">
        {body}
      </Link>
    );
  }

  return body;
}
