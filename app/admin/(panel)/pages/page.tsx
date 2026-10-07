"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSitePages, useToggleSitePageStatus } from "@/hooks/useSitePages";
import type { SitePageSlug } from "@/app/types/sitePage";
import { SitePageTable } from "@/components/admin/sitePage/SitePageTable";
import { getErrorMessage } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function SitePagesAdminPage() {
  const [togglingSlug, setTogglingSlug] = useState<SitePageSlug | null>(null);

  const { data: pages = [], isLoading, isError, error, refetch } = useSitePages();
  const toggleStatus = useToggleSitePageStatus();

  const handleToggleStatus = async (slug: SitePageSlug) => {
    if (togglingSlug) return;
    setTogglingSlug(slug);
    try {
      const updated = await toggleStatus.mutateAsync(slug);
      toast.success(
        updated.isActive
          ? "Page published — it is now live on the site"
          : "Page unpublished — visitors will see a not-found page"
      );
    } catch (err: unknown) {
      toast.error(
        "Could not change status: " + getErrorMessage(err, "Network error")
      );
    } finally {
      setTogglingSlug(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Pages</h1>
        <p className="text-sm text-neutral-500 mt-1">
          The legal pages linked from the site footer. Contact details are
          edited under Settings.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
            >
              <div className="flex items-center gap-4 w-full">
                <Skeleton className="w-11 h-11 rounded-xl bg-[#F8E7D2]/80 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48 bg-[#F8E7D2]/80" />
                  <Skeleton className="h-3 w-64 bg-[#F8E7D2]/60" />
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Skeleton className="h-6 w-20 rounded-full bg-[#F8E7D2]/80" />
                <Skeleton className="h-9 w-20 rounded-xl bg-[#F8E7D2]/80" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load pages</h3>
          <p className="text-sm text-red-600 mb-5">
            {error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : (
        <SitePageTable
          pages={pages}
          togglingSlug={togglingSlug}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}
