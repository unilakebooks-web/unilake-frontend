"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Loader2, Trash2 } from "lucide-react";
import { PageWithBubbles } from "@/app/types/comic";
import { useDeletePage } from "@/hooks/usePages";
import { toast } from "sonner";

interface PageDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: PageWithBubbles | null;
  comicId: string;
}

export function PageDeleteDialog({ open, onOpenChange, page, comicId }: PageDeleteDialogProps) {
  const { mutateAsync: deletePage, isPending } = useDeletePage();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!page) return null;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await deletePage({ pageId: page.id, comicId });
      toast.success(`Page ${page.pageNumber} deleted successfully`);
      onOpenChange(false);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to delete page");
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
                Delete Page {page.pageNumber}?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                This will delete the artwork and all mapped bubbles.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 p-4 flex gap-4 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700">
          <div className="w-12 h-16 bg-neutral-200 rounded overflow-hidden shadow-sm shrink-0">
            {page.artworkUrl && <img src={page.artworkUrl} alt="Artwork" className="w-full h-full object-cover" />}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Page {page.pageNumber}</p>
            <p className="text-xs text-neutral-500 mt-1">
              Contains {page.bubbles.length} mapped bubble(s)
            </p>
          </div>
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
              <><Trash2 className="w-4 h-4 mr-2" /> Delete Page</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
