import { LayoutDashboard } from "lucide-react";

/**
 * Same shape as OrderListPageHeader — purple icon tile, black uppercase title,
 * one muted line underneath.
 */
export function OverviewPageHeader({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-[#914A8C]/10 flex items-center justify-center shrink-0">
        <LayoutDashboard className="w-6 h-6 text-[#914A8C]" />
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">
          Overview
        </h1>
        <p className="text-sm font-semibold text-neutral-500 truncate">
          {subtitle ?? "Loading…"}
        </p>
      </div>
    </div>
  );
}
