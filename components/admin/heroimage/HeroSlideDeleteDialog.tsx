"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Loader2, Trash2 } from "lucide-react";
import { HeroImage } from "@/app/types/heroimage";

interface HeroSlideDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heroImage: HeroImage | null;
  onConfirm: (id: string) => Promise<void>;
}

export function HeroSlideDeleteDialog({
  open,
  onOpenChange,
  heroImage,
  onConfirm,
}: HeroSlideDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!heroImage) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(heroImage.id);
      onOpenChange(false);
    } catch {
      // Parent displays toast notification
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isDeleting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-red-200 shadow-xl rounded-3xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Delete Hero Slide?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                This action is permanent and removes the banner from the homepage carousel immediately.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Banner Preview Thumbnail */}
        <div className="my-4 rounded-2xl overflow-hidden bg-neutral-900 aspect-[16/9] border border-neutral-200 shadow-sm relative">
          <img
            src={heroImage.imageUrl}
            alt="Banner scheduled for deletion"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-red-950/20 mix-blend-multiply pointer-events-none" />
        </div>

        <p className="text-xs text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200/80 font-medium">
          Note: This removes the slide database record. Because ordering is newest-first, if you ever re-upload this banner later, it will be positioned as Slide #1.
        </p>

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100 mt-2">
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
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanently</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
