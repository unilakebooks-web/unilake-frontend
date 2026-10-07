"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { ComicDetail, ComicStatus, PageWithBubbles } from "@/app/types/comic";
import { FileImage, Plus, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReorderPages } from "@/hooks/usePages";

import { SortablePageCard } from "@/components/admin/comic/pages/SortablePageCard";
import { PageCreateModal } from "@/components/admin/comic/pages/PageCreateModal";
import { PageEditModal } from "@/components/admin/comic/pages/PageEditModal";
import { PageDeleteDialog } from "@/components/admin/comic/pages/PageDeleteDialog";
import { SaveOrderButton } from "@/components/admin/announcement/SaveOrderButton";

interface PageListProps {
  comic: ComicDetail;
}

export function PageList({ comic }: PageListProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PageWithBubbles | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageWithBubbles | null>(null);

  const { mutateAsync: reorderPages, isPending: isSavingOrder } = useReorderPages();
  const [orderedPages, setOrderedPages] = useState<PageWithBubbles[]>([]);

  const serverPages = useMemo(
    () => [...comic.pages].sort((a, b) => a.pageNumber - b.pageNumber),
    [comic.pages]
  );

  // Resync local order whenever server data changes — after a save, or after a
  // create/delete elsewhere invalidates the comic query.
  useEffect(() => {
    setOrderedPages(serverPages);
  }, [serverPages]);

  // Deleting a middle page leaves gaps (1, 3, 4). Those pages are already in the
  // right ORDER, so the comparison below wouldn't fire and the admin would have
  // no way to trigger a renumber. The reorder endpoint always writes back 1..N.
  const isNumberingContiguous = serverPages.every(
    (p, i) => p.pageNumber === i + 1
  );

  // The length guard matters: between a page being deleted and the effect above
  // firing there is a render where the arrays differ in length, and .some()
  // would report a false dirty state.
  const isOrderDirty =
    (orderedPages.length === serverPages.length &&
      orderedPages.some((p, i) => p.id !== serverPages[i].id)) ||
    !isNumberingContiguous;

  // Backend returns 409 for a published comic — lock the UI instead of letting
  // the admin drag into an error.
  const isReorderLocked = comic.status === ComicStatus.PUBLISHED;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Without a movement threshold, clicking Edit/Map/Delete starts a drag.
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedPages.findIndex((p) => p.id === active.id);
    const newIndex = orderedPages.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setOrderedPages(arrayMove(orderedPages, oldIndex, newIndex));
  };

  const handleSaveOrder = async () => {
    if (!isOrderDirty || isSavingOrder) return;
    try {
      await reorderPages({
        comicId: comic.id,
        orderedPageIds: orderedPages.map((p) => p.id),
      });
      toast.success("Page order saved");
    } catch (err: any) {
      toast.error(err?.message || "Could not save the new page order");
      setOrderedPages(serverPages); // snap back to the server's truth
    }
  };

  const pagesRemaining = comic.pageCount - serverPages.length;

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Pages & Bubbles</h2>
          <p className="text-sm text-neutral-500">
            Upload artwork and map speech bubbles for each page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isReorderLocked && serverPages.length > 1 && (
            <SaveOrderButton
              isDirty={isOrderDirty}
              isSaving={isSavingOrder}
              onSave={handleSaveOrder}
            />
          )}
          <Button
            onClick={() => setCreateModalOpen(true)}
            disabled={pagesRemaining <= 0}
            className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold shadow-sm px-5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Page
          </Button>
        </div>
      </div>

      {!isNumberingContiguous && !isReorderLocked && serverPages.length > 1 && (
        <div className="mb-6 p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Page numbers have gaps</h4>
            <p className="text-xs font-medium mt-1">
              Click Save Order to renumber them 1–{serverPages.length}.
            </p>
          </div>
        </div>
      )}

      {isReorderLocked && serverPages.length > 1 && (
        <div className="mb-6 p-4 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 flex items-start gap-3">
          <Lock className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Reordering locked</h4>
            <p className="text-xs font-medium mt-1">
              Unpublish this comic to change the page order.
            </p>
          </div>
        </div>
      )}

      {pagesRemaining !== 0 && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
          pagesRemaining > 0 ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">
              {pagesRemaining > 0 ? "Missing Pages" : "Too Many Pages"}
            </h4>
            <p className="text-xs font-medium mt-1">
              {serverPages.length} of {comic.pageCount} pages created.
              {pagesRemaining > 0 
                ? ` You need to add ${pagesRemaining} more page(s) before publishing.` 
                : ` You have ${Math.abs(pagesRemaining)} extra page(s). Delete them or update the comic total page count.`
              }
            </p>
          </div>
        </div>
      )}

      {orderedPages.length === 0 ? (
        <div className="bg-neutral-50/50 border border-dashed border-neutral-200 rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#F8E7D2] flex items-center justify-center mb-3">
            <FileImage className="w-6 h-6 text-[#914A8C]" />
          </div>
          <p className="text-neutral-900 font-bold mb-1">No Pages Yet</p>
          <p className="text-sm text-neutral-500 mb-4">
            Start by adding your first page.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* rectSortingStrategy, not vertical — this is a responsive grid. */}
          <SortableContext
            items={orderedPages.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {orderedPages.map((page, idx) => (
                <SortablePageCard
                  key={page.id}
                  page={page}
                  displayNumber={idx + 1}
                  disabled={isReorderLocked}
                  onEdit={() => setEditTarget(page)}
                  onDelete={() => setDeleteTarget(page)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <PageCreateModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
        comic={comic}
        nextPageNumber={
          serverPages.length > 0
            ? Math.max(...serverPages.map((p) => p.pageNumber)) + 1
            : 1
        }
      />

      <PageEditModal
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        page={editTarget}
        comic={comic}
        comicId={comic.id}
      />

      <PageDeleteDialog 
        open={!!deleteTarget} 
        onOpenChange={(open) => !open && setDeleteTarget(null)} 
        page={deleteTarget} 
        comicId={comic.id}
      />
    </div>
  );
}
