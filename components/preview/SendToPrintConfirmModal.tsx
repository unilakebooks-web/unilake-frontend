"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Printer } from "lucide-react";

interface SendToPrintConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  pageCount: number;
  errorMessage: string | null;
}

export default function SendToPrintConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  pageCount,
  errorMessage,
}: SendToPrintConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        className="sm:max-w-md p-8 rounded-[32px] border-[3px] border-[#3F3C95] shadow-[6px_6px_0px_0px_#3F3C95] bg-white"
      >
        <DialogHeader className="mb-2">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#FFD54A] border-[3px] border-[#3F3C95] flex items-center justify-center">
            <Printer className="w-7 h-7 text-[#3F3C95]" />
          </div>
          <DialogTitle className="text-2xl font-black text-[#3F3C95] tracking-wide text-center uppercase">
            Send this book to print?
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 font-semibold">
            We&apos;ll print the {pageCount} pages exactly as you see them now. Once you
            confirm, your book is locked and the versions can&apos;t be changed.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-semibold text-center">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-3 mt-6">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full h-14 rounded-2xl border-[3px] border-[#3F3C95] bg-[#FFD54A] text-[#3F3C95] font-bold text-base uppercase tracking-wider shadow-[4px_4px_0px_0px_#3F3C95] flex items-center justify-center gap-2 transition-all duration-150 enabled:cursor-pointer enabled:hover:-translate-x-[2px] enabled:hover:-translate-y-[2px] enabled:hover:shadow-[6px_6px_0px_0px_#3F3C95] enabled:active:translate-x-[2px] enabled:active:translate-y-[2px] enabled:active:shadow-[2px_2px_0px_0px_#3F3C95] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Sending…
              </>
            ) : (
              "Yes, print my book"
            )}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="w-full h-12 rounded-2xl font-bold text-sm text-[#3F3C95] transition-colors enabled:cursor-pointer enabled:hover:bg-[#3F3C95]/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Keep editing
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
