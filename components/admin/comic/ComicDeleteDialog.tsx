import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TriangleAlert, Loader2, Trash2 } from "lucide-react";
import { ComicListItem } from "@/app/types/comic";
import { useDeleteComic } from "@/hooks/useComics";
import { toast } from "sonner";

interface ComicDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comic: ComicListItem | null;
}

export function ComicDeleteDialog({ open, onOpenChange, comic }: ComicDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const { mutateAsync: deleteComic, isPending } = useDeleteComic();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!comic) return null;

  const isMatch = confirmText === comic.title;

  const handleConfirm = async () => {
    if (!isMatch) return;
    setErrorMessage(null);
    try {
      await deleteComic(comic.id);
      toast.success("Comic has been permanently deleted.");
      onOpenChange(false);
      setConfirmText("");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to delete comic.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-red-200 shadow-xl rounded-2xl p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Delete Comic?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 p-4 flex gap-4 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700">
          <div className="w-12 h-16 bg-neutral-200 rounded overflow-hidden shadow-sm shrink-0">
            {comic.coverThumbnailUrls?.[0] ? (
              <img src={comic.coverThumbnailUrls[0]} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-neutral-200" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">{comic.title}</p>
            <p className="text-xs text-neutral-500 mt-1">
              {comic._count.pages} pages • {comic.status}
            </p>
          </div>
        </div>

        {comic._count.orderSessions > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
            Warning: {comic._count.orderSessions} active order sessions reference this comic.
          </div>
        )}

        <div className="space-y-2 mb-2">
          <p className="text-sm font-medium text-neutral-700">
            Type <span className="font-bold select-all bg-neutral-100 px-1 rounded">{comic.title}</span> to confirm
          </p>
          <Input 
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={comic.title}
            className="rounded-xl"
          />
        </div>

        {errorMessage && (
          <div className="mb-2 p-2 bg-red-50 text-red-800 text-xs font-semibold rounded-lg text-center">
            {errorMessage}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100">
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isMatch || isPending}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold h-10 px-5 shadow-sm"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
            ) : (
              <><Trash2 className="w-4 h-4 mr-2" /> Delete Permanently</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
