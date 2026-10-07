"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ContactEnquiry, ContactEnquiryStatus } from "@/app/types/contactEnquiry";
import {
  useContactEnquiries,
  useUpdateContactEnquiryStatus,
  useDeleteContactEnquiry,
} from "@/hooks/useContactEnquiries";

import { ContactEnquiryPageHeader } from "@/components/admin/contactEnquiry/ContactEnquiryPageHeader";
import { ContactEnquiryTable } from "@/components/admin/contactEnquiry/ContactEnquiryTable";
import { ContactEnquiryDeleteDialog } from "@/components/admin/contactEnquiry/ContactEnquiryDeleteDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ContactEnquiriesPage() {
  const [activeFilter, setActiveFilter] = useState<ContactEnquiryStatus | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ContactEnquiry | null>(null);

  const { data: enquiries = [], isLoading, isError, error, refetch } = useContactEnquiries(activeFilter);
  const updateStatus = useUpdateContactEnquiryStatus();
  const deleteEnquiry = useDeleteContactEnquiry();

  const handleUpdateStatus = async (id: string, status: ContactEnquiryStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Enquiry marked as ${status}`);
    } catch (err: unknown) {
      toast.error(
        "Could not update status: " + getErrorMessage(err, "Network error")
      );
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteEnquiry.mutateAsync(id);
      toast.success("Enquiry has been deleted");
    } catch (err: unknown) {
      toast.error(
        "Failed to delete enquiry: " + getErrorMessage(err, "Server error")
      );
      // Rethrown so the dialog knows the delete failed and stays open.
      throw err;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <ContactEnquiryPageHeader
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
                  <Skeleton className="h-3 w-56 bg-[#F8E7D2]/60" />
                  <Skeleton className="h-3 w-full max-w-md bg-[#F8E7D2]/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load Enquiries</h3>
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
        <ContactEnquiryTable
          enquiries={enquiries}
          onUpdateStatus={handleUpdateStatus}
          onDelete={(target) => setDeleteTarget(target)}
        />
      )}

      <ContactEnquiryDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        enquiry={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
