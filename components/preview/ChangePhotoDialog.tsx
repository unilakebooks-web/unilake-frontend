"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TriangleAlert } from "lucide-react";
import { hankenGrotesk } from "@/app/fonts";

interface ChangePhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Confirmation before starting over with a new photo.
 *
 * Earns its place: the pages already on screen took a couple of minutes of GPU
 * time to produce, and continuing here abandons all of them for a fresh
 * generation. A misclick should not be able to do that silently.
 */
export default function ChangePhotoDialog({
  open,
  onOpenChange,
  onConfirm,
}: ChangePhotoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Start over with a new photo?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                This preview will be replaced.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p
          className={`${hankenGrotesk.className} text-sm text-neutral-600 leading-relaxed my-2`}
        >
          We&apos;ll start a fresh personalization with your new photo. The pages
          you can see now will be left behind, and your new book will take a
          couple of minutes to generate.
        </p>

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-5 text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[#403A8B] hover:bg-[#4a449d] text-white font-semibold h-10 px-5 text-sm shadow-sm cursor-pointer"
          >
            Continue
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
