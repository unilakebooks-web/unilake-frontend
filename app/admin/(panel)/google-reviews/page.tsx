"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";
import {
  useGoogleReviews,
  useToggleGoogleReviewStatus,
  useDeleteGoogleReview,
} from "@/hooks/useGoogleReviews";
import type { GoogleReview } from "@/app/types/googleReview";
import { GoogleReviewTable } from "@/components/admin/googleReview/GoogleReviewTable";
import { GoogleReviewModal } from "@/components/admin/googleReview/GoogleReviewModal";
import { GoogleReviewDeleteDialog } from "@/components/admin/googleReview/GoogleReviewDeleteDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";

export default function GoogleReviewsAdminPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GoogleReview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoogleReview | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: reviews = [], isLoading, isError, error, refetch } =
    useGoogleReviews();
  const toggleStatus = useToggleGoogleReviewStatus();
  const deleteReview = useDeleteGoogleReview();

  const handleAdd = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleEdit = (review: GoogleReview) => {
    setEditTarget(review);
    setModalOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    if (togglingId) return;
    setTogglingId(id);
    try {
      const updated = await toggleStatus.mutateAsync(id);
      toast.success(
        updated.isActive
          ? "Review is now live on the homepage"
          : "Review hidden from the homepage"
      );
    } catch (err: unknown) {
      toast.error(
        "Could not change status: " + getErrorMessage(err, "Network error")
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteReview.mutateAsync(id);
      toast.success("Review deleted");
    } catch (err: unknown) {
      toast.error("Failed to delete: " + getErrorMessage(err, "Server error"));
      throw err;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Google Reviews</h1>
          <p className="text-sm text-neutral-500 mt-1">
            The &quot;Excellent On Google&quot; section on the homepage. Newest
            reviews appear first.
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Review
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
            >
              <div className="flex items-center gap-4 w-full">
                <Skeleton className="w-12 h-12 rounded-full bg-[#F8E7D2]/80 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40 bg-[#F8E7D2]/80" />
                  <Skeleton className="h-4 w-full max-w-md bg-[#F8E7D2]/60" />
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Skeleton className="h-6 w-16 rounded-full bg-[#F8E7D2]/80" />
                <Skeleton className="h-8 w-8 rounded-xl bg-[#F8E7D2]/80" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load reviews</h3>
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
        <GoogleReviewTable
          reviews={reviews}
          togglingId={togglingId}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
          onDelete={(target) => setDeleteTarget(target)}
        />
      )}

      {/* Mounted only while open, and keyed by the review being edited, so
          every open starts from clean state with no reset logic inside. */}
      {modalOpen && (
        <GoogleReviewModal
          key={editTarget?.id ?? "new"}
          onOpenChange={setModalOpen}
          review={editTarget}
        />
      )}

      <GoogleReviewDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        review={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
