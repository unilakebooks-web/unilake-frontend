"use client";

import { usePageSeos } from "@/hooks/useSeo";
import { PageSeoCard } from "@/components/admin/seo/PageSeoCard";
import { PAGE_SEO_SLUGS } from "@/app/types/seo";
import { getErrorMessage } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function SeoAdminPage() {
  const { data: pages = [], isLoading, isError, error, refetch } = usePageSeos();

  // The API returns all ten slugs; ordering here keeps the screen stable if it ever does not.
  const ordered = PAGE_SEO_SLUGS.flatMap((slug) => {
    const page = pages.find((p) => p.slug === slug);
    return page ? [page] : [];
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">SEO</h1>
        <p className="text-sm text-neutral-500 mt-1">
          What Google shows and the preview card when a page is shared. Every
          field is optional: a blank field keeps the page&apos;s built-in text.
          Comics and blog posts are edited on their own screens.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl bg-[#F8E7D2]/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load SEO settings</h3>
          <p className="text-sm text-red-600 mb-5">
            {getErrorMessage(error, "Unknown error")}
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
        <div className="space-y-6">
          {ordered.map((page) => (
            <PageSeoCard
              key={`${page.slug}:${page.updatedAt ?? "unsaved"}`}
              page={page}
            />
          ))}
        </div>
      )}
    </div>
  );
}
