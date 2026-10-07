"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Faq, FaqPlacement } from "@/app/types/faq";
import {
  useFaqs,
  useCreateFaq,
  useUpdateFaq,
  useToggleFaqStatus,
  useDeleteFaq,
} from "@/hooks/useFaqs";
import { reorderFaqs } from "@/app/actions/faq";

import { FaqPageHeader } from "@/components/admin/faq/FaqPageHeader";
import { FaqTable } from "@/components/admin/faq/FaqTable";
import { FaqModal } from "@/components/admin/faq/FaqModal";
import { FaqDeleteDialog } from "@/components/admin/faq/FaqDeleteDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export default function FaqsAdminPage() {
  const [activeTab, setActiveTab] = useState<FaqPlacement>("HOME");
  
  // We manage the local list state so we can do drag-and-drop before saving
  const [localFaqs, setLocalFaqs] = useState<Faq[]>([]);
  
  // Track the server's confirmed order separately for each placement
  const [serverOrderHome, setServerOrderHome] = useState<string[]>([]);
  const [serverOrderComic, setServerOrderComic] = useState<string[]>([]);

  // Fetch ALL FAQs (no placement param) so we have both sets in memory
  const { data: allFaqs = [], isLoading, isError, refetch } = useFaqs();
  
  const createMutation = useCreateFaq();
  const updateMutation = useUpdateFaq();
  const toggleStatusMutation = useToggleFaqStatus();
  const deleteMutation = useDeleteFaq();

  // Operation loading states
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);

  // Dialogs state
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    target: Faq | null;
  }>({
    open: false,
    mode: "create",
    target: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);

  // When data comes in from the server, initialize the local state and server orders
  useEffect(() => {
    if (allFaqs.length > 0 || !isLoading) {
      // Initialize server order tracking
      const homeFaqs = allFaqs.filter(f => f.placement === "HOME").sort((a, b) => a.sortOrder - b.sortOrder);
      const comicFaqs = allFaqs.filter(f => f.placement === "COMIC").sort((a, b) => a.sortOrder - b.sortOrder);
      
      setServerOrderHome(homeFaqs.map(f => f.id));
      setServerOrderComic(comicFaqs.map(f => f.id));
      
      // We keep EVERYTHING in localFaqs, but we'll filter it for display
      setLocalFaqs(allFaqs);
    }
  }, [allFaqs, isLoading]);

  // Derived filtered list for the active tab
  const displayedFaqs = useMemo(() => {
    return localFaqs
      .filter(f => f.placement === activeTab)
      .sort((a, b) => {
        // Sort by the local array position if possible, fallback to sortOrder
        const activeServerOrder = activeTab === "HOME" ? serverOrderHome : serverOrderComic;
        
        // This is a bit tricky: when dragging, we update localFaqs. 
        // We'll rely on the array index in localFaqs for sorting if they are already filtered,
        // but since localFaqs contains BOTH tabs, we need a robust way to sort.
        // Easiest is to just use a derived array that we actually mutate on drag.
        return 0; // We will handle this differently below
      });
  }, [localFaqs, activeTab, serverOrderHome, serverOrderComic]);

  // Actually, since we need to drag and drop, it's better to maintain the filtered list directly
  // Let's create a dedicated state for the currently displayed items
  const [activeTabFaqs, setActiveTabFaqs] = useState<Faq[]>([]);

  // Update activeTabFaqs whenever localFaqs or activeTab changes
  useEffect(() => {
    const filtered = localFaqs
      .filter(f => f.placement === activeTab)
      .sort((a, b) => a.sortOrder - b.sortOrder); // Initial sort by server order
      
    // Re-apply any local drag order if it exists (by matching against the current server order)
    // Actually, simpler: just let `activeTabFaqs` be the source of truth for the UI order.
    // When `allFaqs` changes (refetch), this resets. When they drag, we update this array.
    setActiveTabFaqs(filtered);
  }, [localFaqs, activeTab]);

  // Calculate if local reordering differs from last server-confirmed ordering
  const isOrderDirty = useMemo(() => {
    const currentServerOrder = activeTab === "HOME" ? serverOrderHome : serverOrderComic;
    if (activeTabFaqs.length !== currentServerOrder.length) return false;
    const currentIds = activeTabFaqs.map((f) => f.id).join(",");
    return currentIds !== currentServerOrder.join(",");
  }, [activeTabFaqs, activeTab, serverOrderHome, serverOrderComic]);

  // Handle Create / Edit Save from Modal
  const handleModalSave = async (payload: { question: string; answer: string; placement: FaqPlacement }) => {
    if (modalState.mode === "create") {
      try {
        await createMutation.mutateAsync(payload);
        toast.success("FAQ has been created");
        // Refetching happens via mutation onSuccess
      } catch (err: any) {
        toast.error("Failed to create FAQ: " + (err?.message || "Server error"));
        throw err;
      }
    } else if (modalState.mode === "edit" && modalState.target) {
      try {
        await updateMutation.mutateAsync({ id: modalState.target.id, payload });
        toast.success("FAQ has been updated");
      } catch (err: any) {
        toast.error("Failed to update FAQ: " + (err?.message || "Server error"));
        throw err;
      }
    }
  };

  // Handle Status Toggle (flips isActive via blind toggle endpoint)
  const handleToggleStatus = async (id: string) => {
    if (togglingId) return; // Prevent rapid double-clicking during flight
    setTogglingId(id);
    try {
      const updated = await toggleStatusMutation.mutateAsync(id);
      toast.success(
        updated.isActive
          ? "FAQ published (ACTIVE)"
          : "FAQ hidden from storefront"
      );
      
      // Update local state so UI reflects immediately without full refetch jump
      setActiveTabFaqs(prev => prev.map(f => f.id === id ? { ...f, isActive: updated.isActive } : f));
      
    } catch (err: any) {
      toast.error("Could not toggle status: " + (err?.message || "Network error"));
    } finally {
      setTogglingId(null);
    }
  };

  // Handle local drag reordering
  const handleReorder = (newOrder: Faq[]) => {
    setActiveTabFaqs(newOrder);
  };

  // Handle Save Order call to reorder endpoint
  const handleSaveOrder = async () => {
    if (!isOrderDirty || isSavingOrder) return;
    setIsSavingOrder(true);
    const orderedIds = activeTabFaqs.map((f) => f.id);
    try {
      const reSortedList = await reorderFaqs(orderedIds);
      
      // Update the server order tracking for this tab
      if (activeTab === "HOME") {
        setServerOrderHome(reSortedList.map(f => f.id));
      } else {
        setServerOrderComic(reSortedList.map(f => f.id));
      }
      
      // Mutate the react-query cache directly to avoid a full refetch flash
      toast.success("Order has been saved");
    } catch (err: any) {
      const msg = err?.message || "Error occurred saving order";
      toast.error(`Could not save new order: ${msg}`);
      if (msg.toLowerCase().includes("do not exist") || msg.toLowerCase().includes("refetch")) {
        refetch();
      }
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Handle Delete Permanent
  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("FAQ has been deleted");
    } catch (err: any) {
      toast.error("Failed to delete FAQ: " + (err?.message || "Server error"));
      throw err;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Page Header */}
      <FaqPageHeader
        onAddClick={() =>
          setModalState({ open: true, mode: "create", target: null })
        }
        isOrderDirty={isOrderDirty}
        isSavingOrder={isSavingOrder}
        onSaveOrder={handleSaveOrder}
      />

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100/50 rounded-xl w-max border border-gray-200">
        <button
          onClick={() => setActiveTab("HOME")}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeTab === "HOME"
              ? "bg-white text-[#914A8C] shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        >
          Homepage FAQs
        </button>
        <button
          onClick={() => setActiveTab("COMIC")}
          className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
            activeTab === "COMIC"
              ? "bg-white text-[#914A8C] shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
          }`}
        >
          Comic Detail FAQs
        </button>
      </div>

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
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load FAQs</h3>
          <p className="text-sm text-red-600 mb-5">Please try again.</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <FaqTable
          faqs={activeTabFaqs}
          placement={activeTab}
          togglingId={togglingId}
          onReorder={handleReorder}
          onToggleStatus={handleToggleStatus}
          onEdit={(target) => setModalState({ open: true, mode: "edit", target })}
          onDelete={(target) => setDeleteTarget(target)}
          onAddFirst={() => setModalState({ open: true, mode: "create", target: null })}
        />
      )}

      {/* Create / Edit Modal */}
      <FaqModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
        mode={modalState.mode}
        placement={modalState.target ? modalState.target.placement : activeTab} // Inherit from active tab on create
        initialQuestion={modalState.target?.question || ""}
        initialAnswer={modalState.target?.answer || ""}
        onSave={handleModalSave}
      />

      {/* Delete Confirmation Dialog */}
      <FaqDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        faq={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
