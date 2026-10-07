"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Loader2, Trash2 } from "lucide-react";
import { FontWithCount } from "@/app/types/comic";
import { useDeleteFont } from "@/hooks/useFonts";
import { toast } from "sonner";

interface FontDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  font: FontWithCount | null;
  comicId: string;
}

export function FontDeleteDialog({ open, onOpenChange, font, comicId }: FontDeleteDialogProps) {
  const { mutateAsync: deleteFont, isPending } = useDeleteFont();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!font) return null;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await deleteFont({ fontId: font.id, comicId });
      toast.success("Font deleted successfully");
      onOpenChange(false);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to delete font");
    }
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-red-200 shadow-xl rounded-3xl p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Delete Font?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700">
          <p className="text-sm font-bold">{font.name}</p>
          <p className="text-xs text-neutral-500 mt-1 font-mono">
            Used in {font._count.bubbles} bubble(s)
          </p>
        </div>

        {errorMessage && (
          <div className="mb-2 p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-xl text-center border border-red-200">
            {errorMessage}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-11 px-5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold h-11 px-5 shadow-sm"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
            ) : (
              <><Trash2 className="w-4 h-4 mr-2" /> Delete Font</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
