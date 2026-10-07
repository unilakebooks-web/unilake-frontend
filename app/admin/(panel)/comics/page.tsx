"use client";

import { useState, useMemo } from "react";
import { useComics } from "@/hooks/useComics";
import { ComicListItem } from "@/app/types/comic";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ComicListPageHeader } from "@/components/admin/comic/ComicListPageHeader";
import { ComicListFilters } from "@/components/admin/comic/ComicListFilters";
import { ComicListTable } from "@/components/admin/comic/ComicListTable";
import { ComicPagination } from "@/components/admin/comic/ComicPagination";
import { ComicDeleteDialog } from "@/components/admin/comic/ComicDeleteDialog";
import type { ComicTagFilters } from "@/lib/comicTags";

const PAGE_SIZE = 10;

export default function ComicsPage() {
  const [filters, setFilters] = useState<ComicTagFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ComicListItem | null>(null);

  const { data: comics, isLoading, error, refetch } = useComics(filters);

  // Client-side pagination
  const paginatedComics = useMemo(() => {
    if (!comics) return [];
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return comics.slice(startIndex, startIndex + PAGE_SIZE);
  }, [comics, currentPage]);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <ComicListPageHeader />

      <ComicListFilters onFiltersChange={handleFiltersChange} />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-14 rounded-md bg-[#F8E7D2]/80" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 bg-[#F8E7D2]/80" />
                  <Skeleton className="h-4 w-32 bg-[#F8E7D2]/60" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-full bg-[#F8E7D2]/80" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load Comics</h3>
          <p className="text-sm text-red-600 mb-5">{(error as any)?.message || "Network error"}</p>
          <Button
            onClick={() => refetch()}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <ComicListTable
            comics={paginatedComics}
            onDeleteClick={(comic) => setDeleteTarget(comic)}
          />
          <ComicPagination
            currentPage={currentPage}
            totalItems={comics?.length || 0}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <ComicDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        comic={deleteTarget}
      />
    </div>
  );
}
