"use client";

import { useSiteSetting } from "@/hooks/useSiteSettings";
import { SiteSettingForm } from "@/components/admin/setting/SiteSettingForm";
import { StoreStatusToggle } from "@/components/admin/setting/StoreStatusToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function SettingsAdminPage() {
  const { data: setting, isLoading, isError, error, refetch } = useSiteSetting();

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Store status, plus the brand and contact details shown on the Contact
          page and in the site footer.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-8 space-y-5"
            >
              <Skeleton className="h-6 w-40 bg-[#F8E7D2]/80" />
              <Skeleton className="h-11 w-full bg-[#F8E7D2]/60" />
              <Skeleton className="h-11 w-full bg-[#F8E7D2]/60" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load settings</h3>
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
        /* `setting` is null until the first save — an empty form, not an error.
           The toggle sits above the form and saves on its own; the two write to
           different columns and never to each other's. */
        <>
          <StoreStatusToggle setting={setting ?? null} />
          <SiteSettingForm setting={setting ?? null} />
        </>
      )}
    </div>
  );
}
