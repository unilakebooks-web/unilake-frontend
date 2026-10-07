"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Loader2, Trash2 } from "lucide-react";
import type { GoogleReview } from "@/app/types/googleReview";

interface GoogleReviewDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: GoogleReview | null;
  onConfirm: (id: string) => Promise<void>;
}

export function GoogleReviewDeleteDialog({
  open,
  onOpenChange,
  review,
  onConfirm,
}: GoogleReviewDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!review) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(review.id);
      onOpenChange(false);
    } catch {
      // Parent displays the toast.
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
                Delete this review?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                This cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm text-neutral-600 py-2">
          <span className="font-semibold text-neutral-900">
            {review.customerName}
          </span>
          &apos;s review will be permanently removed from the homepage, along
          with its uploaded image.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-5 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={handleConfirm}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold h-10 px-5 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
