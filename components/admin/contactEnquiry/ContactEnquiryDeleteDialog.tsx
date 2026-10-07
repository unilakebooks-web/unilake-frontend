"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Loader2, Trash2 } from "lucide-react";
import { ContactEnquiry } from "@/app/types/contactEnquiry";

interface ContactEnquiryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enquiry: ContactEnquiry | null;
  onConfirm: (id: string) => Promise<void>;
}

export function ContactEnquiryDeleteDialog({
  open,
  onOpenChange,
  enquiry,
  onConfirm,
}: ContactEnquiryDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!enquiry) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(enquiry.id);
      onOpenChange(false);
    } catch {
      // Parent displays toast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isDeleting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-red-200 shadow-xl rounded-2xl p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Delete Enquiry?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                Consider marking it as <strong className="text-neutral-700">Resolved</strong> instead. Deletion is permanent, and the sender&apos;s contact details go with it.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Email is shown alongside the name: two enquiries from the same
            person are common, and the address is what tells them apart. */}
        <div className="my-4 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col gap-1.5">
          <span className="text-xs font-bold text-neutral-800">From: {enquiry.name}</span>
          <span className="text-xs text-neutral-500 font-medium break-all">{enquiry.email}</span>
          <p className="text-neutral-600 text-sm font-medium italic line-clamp-3 relative">
            <span className="text-neutral-400 select-none mr-1">&ldquo;</span>
            {enquiry.message}
            <span className="text-neutral-400 select-none ml-1">&rdquo;</span>
          </p>
        </div>

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-5 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold h-10 px-5 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
