"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Feedback, FeedbackStatus } from "@/app/types/feedback";
import { useFeedbacks, useUpdateFeedbackStatus, useDeleteFeedback } from "@/hooks/useFeedbacks";

import { FeedbackPageHeader } from "@/components/admin/feedback/FeedbackPageHeader";
import { FeedbackTable } from "@/components/admin/feedback/FeedbackTable";
import { FeedbackDeleteDialog } from "@/components/admin/feedback/FeedbackDeleteDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function FeedbackPage() {
  const [activeFilter, setActiveFilter] = useState<FeedbackStatus | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Feedback | null>(null);

  const { data: feedbacks = [], isLoading, isError, error, refetch } = useFeedbacks(activeFilter);
  const updateStatus = useUpdateFeedbackStatus();
  const deleteFeedback = useDeleteFeedback();

  const handleUpdateStatus = async (id: string, status: FeedbackStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Feedback marked as ${status}`);
    } catch (err: any) {
      toast.error("Could not update status: " + (err?.message || "Network error"));
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteFeedback.mutateAsync(id);
      toast.success("Feedback has been deleted");
    } catch (err: any) {
      toast.error("Failed to delete feedback: " + (err?.message || "Server error"));
      throw err;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <FeedbackPageHeader
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
            >
              <div className="flex items-center gap-3 w-full">
                <Skeleton className="w-10 h-10 rounded-full bg-[#F8E7D2]/80 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48 bg-[#F8E7D2]/80" />
                  <Skeleton className="h-3 w-32 bg-[#F8E7D2]/60" />
                  <Skeleton className="h-3 w-full max-w-md bg-[#F8E7D2]/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load Feedback</h3>
          <p className="text-sm text-red-600 mb-5">{error?.message || "Unknown error"}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : (
        <FeedbackTable
          feedbacks={feedbacks}
          onUpdateStatus={handleUpdateStatus}
          onDelete={(target) => setDeleteTarget(target)}
        />
      )}

      <FeedbackDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        feedback={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
