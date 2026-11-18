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
import { Loader2, Printer } from "lucide-react";

interface SentToPrinterUndoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  errorMessage: string | null;
}

export function SentToPrinterUndoDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  errorMessage,
}: SentToPrinterUndoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        className="sm:max-w-md bg-white border border-[#914A8C]/20 shadow-xl rounded-2xl p-6"
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Remove the sent to printer date?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                The order will show as not sent to the printer. You can mark it again later.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="mt-3 p-2 bg-red-50 text-red-800 text-xs font-semibold rounded-lg text-center">
            {errorMessage}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold h-10 px-5 shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removing…
              </>
            ) : (
              "Remove date"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
