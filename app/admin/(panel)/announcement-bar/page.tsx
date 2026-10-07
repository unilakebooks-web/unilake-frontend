"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Announcement } from "@/app/types/announcement";
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncementStatus,
  reorderAnnouncements,
  deleteAnnouncement,
} from "@/app/actions/announcement";

import { AnnouncementPageHeader } from "@/components/admin/announcement/AnnouncementPageHeader";
import { AnnouncementTable } from "@/components/admin/announcement/AnnouncementTable";
import { AnnouncementModal } from "@/components/admin/announcement/AnnouncementModal";
import { DeleteConfirmDialog } from "@/components/admin/announcement/DeleteConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, AlertCircle } from "lucide-react";

export default function AnnouncementBarPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [serverOrder, setServerOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Operation loading states
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);

  // Dialogs state
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    target: Announcement | null;
  }>({
    open: false,
    mode: "create",
    target: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  // Calculate if local reordering differs from last server-confirmed ordering
  const isOrderDirty = useMemo(() => {
    if (announcements.length !== serverOrder.length) return false;
    const currentIds = announcements.map((a) => a.id).join(",");
    return currentIds !== serverOrder.join(",");
  }, [announcements, serverOrder]);

  // Load announcements from backend
  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data);
      setServerOrder(data.map((item) => item.id));
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to fetch announcements";
      setFetchError(errorMsg);
      toast.error("Could not load announcement bar list: " + errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Handle Create / Edit Save from Modal
  const handleModalSave = async (message: string) => {
    if (modalState.mode === "create") {
      try {
        const created = await createAnnouncement(message);
        toast.success("Announcement has been saved");
        setAnnouncements((prev) => {
          const updated = [...prev, created];
          setServerOrder(updated.map((item) => item.id));
          return updated;
        });
      } catch (err: any) {
        toast.error("Failed to create announcement: " + (err?.message || "Server error"));
        throw err; // Re-throw so modal remains open
      }
    } else if (modalState.mode === "edit" && modalState.target) {
      try {
        const updated = await updateAnnouncement(modalState.target.id, message);
        toast.success("Announcement has been updated");
        setAnnouncements((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      } catch (err: any) {
        toast.error("Failed to update announcement: " + (err?.message || "Server error"));
        throw err;
      }
    }
  };

  // Handle Status Toggle (flips isActive via blind toggle endpoint)
  const handleToggleStatus = async (id: string) => {
    if (togglingId) return; // Prevent rapid double-clicking during flight
    setTogglingId(id);
    try {
      const updated = await toggleAnnouncementStatus(id);
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(
        updated.isActive
          ? "Announcement published (ACTIVE)"
          : "Announcement hidden from storefront"
      );
    } catch (err: any) {
      toast.error("Could not toggle status: " + (err?.message || "Network error"));
    } finally {
      setTogglingId(null);
    }
  };

  // Handle local drag reordering
  const handleReorder = (newOrder: Announcement[]) => {
    setAnnouncements(newOrder);
  };

  // Handle Save Order call to reorder endpoint
  const handleSaveOrder = async () => {
    if (!isOrderDirty || isSavingOrder) return;
    setIsSavingOrder(true);
    const orderedIds = announcements.map((a) => a.id);
    try {
      const reSortedList = await reorderAnnouncements(orderedIds);
      setAnnouncements(reSortedList);
      setServerOrder(reSortedList.map((a) => a.id));
      toast.success("Order has been saved");
    } catch (err: any) {
      const msg = err?.message || "Error occurred saving order";
      toast.error(`Could not save new order: ${msg}`);
      // On 400 existence check failure (e.g. deleted in another tab), refetch clean list
      if (msg.toLowerCase().includes("do not exist") || msg.toLowerCase().includes("refetch")) {
        loadAnnouncements();
      }
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Handle Delete Permanent
  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      toast.success("Announcement has been deleted");
      setAnnouncements((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        setServerOrder(filtered.map((item) => item.id));
        return filtered;
      });
    } catch (err: any) {
      toast.error("Failed to delete announcement: " + (err?.message || "Server error"));
      throw err;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Page Header */}
      <AnnouncementPageHeader
        onAddClick={() =>
          setModalState({ open: true, mode: "create", target: null })
        }
        isOrderDirty={isOrderDirty}
        isSavingOrder={isSavingOrder}
        onSaveOrder={handleSaveOrder}
      />

      {/* Main Content Area: Loading / Error / Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-6 h-6 rounded-md bg-[#F8E7D2]/80" />
                <Skeleton className="w-7 h-7 rounded-full bg-[#F8E7D2]/80" />
                <div className="space-y-2 ml-2">
                  <Skeleton className="h-4 w-64 md:w-96 bg-[#F8E7D2]/80" />
                  <Skeleton className="h-3 w-40 bg-[#F8E7D2]/60" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-20 rounded-xl bg-[#F8E7D2]/80" />
                <Skeleton className="h-8 w-16 rounded-xl bg-[#F8E7D2]/80" />
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load Announcements</h3>
          <p className="text-sm text-red-600 mb-5">{fetchError}</p>
          <button
            onClick={loadAnnouncements}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <AnnouncementTable
          announcements={announcements}
          togglingId={togglingId}
          onReorder={handleReorder}
          onToggleStatus={handleToggleStatus}
          onEdit={(target) => setModalState({ open: true, mode: "edit", target })}
          onDelete={(target) => setDeleteTarget(target)}
          onAddFirst={() => setModalState({ open: true, mode: "create", target: null })}
        />
      )}

      {/* Create / Edit Modal */}
      <AnnouncementModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
        mode={modalState.mode}
        initialMessage={modalState.target?.message || ""}
        onSave={handleModalSave}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        announcement={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
