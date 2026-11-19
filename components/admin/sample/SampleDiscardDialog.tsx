"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, TriangleAlert } from "lucide-react";

interface SampleDiscardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
}

export function SampleDiscardDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: SampleDiscardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-red-200 shadow-xl rounded-2xl p-6 grid-cols-[minmax(0,1fr)]">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Discard this sample?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                Its photo, images and data are deleted from storage within a few
                minutes (a little later if a page is still generating). This
                cannot be undone, so download the PDF first.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="cursor-pointer"
          >
            Keep it
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <span className={isPending ? "ml-2" : ""}>Discard</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
