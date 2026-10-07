"use client";

import Link from "next/link";
import { Loader2, Pencil, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  SITE_PAGE_ROUTES,
  type SitePage,
  type SitePageSlug,
} from "@/app/types/sitePage";

interface SitePageTableProps {
  pages: SitePage[];
  togglingSlug: SitePageSlug | null;
  onToggleStatus: (slug: SitePageSlug) => void;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SitePageTable({
  pages,
  togglingSlug,
  onToggleStatus,
}: SitePageTableProps) {
  return (
    <div className="space-y-4">
      {pages.map((page) => {
        // The backend refuses to publish a page with no content (409), so the
        // toggle is disabled rather than letting the admin click into an error.
        const isSaved = page.id !== null;
        const isToggling = togglingSlug === page.slug;

        return (
          <div
            key={page.slug}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15 shadow-sm"
          >
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#F8E7D2] text-[#914A8C] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-neutral-900 leading-tight truncate">
                  {page.title}
                </h3>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-neutral-500">
                  <code className="font-mono text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded">
                    {SITE_PAGE_ROUTES[page.slug]}
                  </code>

                  {isSaved ? (
                    <span>Updated {formatDate(page.updatedAt)}</span>
                  ) : (
                    <span className="font-semibold text-amber-600">
                      Not created yet
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5 shrink-0 pl-15 sm:pl-0">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${
                    page.isActive ? "text-emerald-600" : "text-neutral-400"
                  }`}
                >
                  {page.isActive ? "Published" : "Draft"}
                </span>

                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#914A8C]" />
                ) : (
                  <Switch
                    checked={page.isActive}
                    disabled={!isSaved}
                    onCheckedChange={() => onToggleStatus(page.slug)}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Publish ${page.title}`}
                  />
                )}
              </div>

              <Link
                href={`/admin/pages/${page.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
