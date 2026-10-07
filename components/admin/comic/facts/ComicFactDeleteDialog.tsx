"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { AdminComicFact } from "@/app/types/comic";

interface ComicFactDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fact: AdminComicFact | null;
  onConfirm: (id: string) => Promise<void>;
}

export function ComicFactDeleteDialog({
  open,
  onOpenChange,
  fact,
  onConfirm,
}: ComicFactDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!fact) return;
    setIsDeleting(true);
    try {
      await onConfirm(fact.id);
      onOpenChange(false);
    } catch {
      // The parent surfaces the error as a toast; just stop the spinner.
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isDeleting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-red-100">
        <DialogHeader className="px-6 py-6 pb-0">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-center text-gray-900">
            Delete this fact?
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 text-center">
          <p className="text-gray-500 font-medium text-sm">
            This cannot be undone. To hide it temporarily instead, switch it off.
          </p>
          {fact && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left border border-gray-100">
              <p className="font-medium text-gray-800 text-sm">{fact.text}</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-xl border border-neutral-300 bg-white px-5 h-11 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 px-6 h-11 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50 inline-flex items-center"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
