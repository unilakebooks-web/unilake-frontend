"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ComicListItem } from "@/app/types/comic";
import { useArrangeComics, useReorderComics } from "@/hooks/useComics";
import { ComicArrangeHeader } from "@/components/admin/comic/arrange/ComicArrangeHeader";
import { ComicArrangeList } from "@/components/admin/comic/arrange/ComicArrangeList";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorCode, getErrorMessage } from "@/lib/utils";

// Keep in step with COMIC_ORDER_BY in the backend's comic.service.ts: the website
// order is sortOrder, then newest first, then id.
function byWebsiteOrder(a: ComicListItem, b: ComicListItem) {
  return (
    a.sortOrder - b.sortOrder ||
    Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

export default function ArrangeComicsPage() {
  const { data, isLoading, isError, error, refetch } = useArrangeComics();
  const reorder = useReorderComics();

  // The order dragged to but not saved (ids), or null. Apart from the server list so
  // a background refetch never throws away an unsaved drag.
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  // Only published books are on the website, so only they are arranged.
  const published = useMemo(
    () => (data ?? []).filter((c) => c.status === "PUBLISHED").sort(byWebsiteOrder),
    [data]
  );

  const orderedComics = useMemo(() => {
    if (!localOrder) return published;
    const byId = new Map(published.map((c) => [c.id, c]));
    const inLocal = new Set(localOrder);
    const dragged = localOrder
      .map((id) => byId.get(id))
      .filter((c): c is ComicListItem => c !== undefined);
    const added = published.filter((c) => !inLocal.has(c.id));
    return [...dragged, ...added];
  }, [published, localOrder]);

  const publishedIds = useMemo(() => new Set(published.map((c) => c.id)), [published]);
  const savedKey = published.map((c) => c.id).join(",");
  const isOrderDirty = localOrder !== null && orderedComics.map((c) => c.id).join(",") !== savedKey;

  // A book was published, unpublished or deleted while the admin was arranging.
  const isStale =
    localOrder !== null &&
    (localOrder.length !== published.length || localOrder.some((id) => !publishedIds.has(id)));

  const handleReorder = (next: ComicListItem[]) => {
    // A drag during a save would be wiped by the answer; a drag while the list is
    // stale would fold the new book into the dragged order and hide the banner.
    if (reorder.isPending || isStale) return;
    const ids = next.map((c) => c.id);
    setLocalOrder(ids.join(",") === savedKey ? null : ids);
  };

  const handleReload = () => {
    setLocalOrder(null);
    refetch();
  };

  const handleSaveOrder = async () => {
    if (!isOrderDirty || isStale || reorder.isPending) return;
    try {
      await reorder.mutateAsync(orderedComics.map((c) => c.id));
      setLocalOrder(null);
      toast.success("Order has been saved");
    } catch (err) {
      if (getErrorCode(err) === "CONFLICT") {
        toast.error("The list of books changed while you were arranging it, so it was reloaded. Please arrange it again.");
        handleReload();
      } else {
        toast.error("Could not save the new order: " + getErrorMessage(err, "Network error"));
      }
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto py-2">
      <ComicArrangeHeader
        isOrderDirty={isOrderDirty && !isStale}
        isSavingOrder={reorder.isPending}
        onSaveOrder={handleSaveOrder}
      />

      {isStale && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
          <span>The list of books has changed since you started arranging. Reload to see it; your unsaved order will be lost.</span>
          <button
            type="button"
            onClick={handleReload}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shrink-0 cursor-pointer"
          >
            Reload
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-2xl bg-[#F8E7D2]/80" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load books</h3>
          <p className="text-sm text-red-600 mb-5">{error?.message || "Unknown error"}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : published.length === 0 ? (
        <div className="bg-white/80 rounded-3xl border-2 border-dashed border-[#914A8C]/25 p-12 text-center text-neutral-500 font-medium">
          No published books yet. Publish a book to arrange it here.
        </div>
      ) : (
        <>
          {published.length === 1 && (
            <p className="text-sm text-neutral-500 font-medium">Only one book is published, so there is nothing to arrange.</p>
          )}
          <ComicArrangeList comics={orderedComics} onReorder={handleReorder} />
        </>
      )}
    </div>
  );
}
