import { useState } from "react";
import { BlogListItem } from "@/app/types/blog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";

interface BlogDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blog: BlogListItem | null;
  onConfirm: (id: string) => Promise<void>;
}

export function BlogDeleteDialog({ open, onOpenChange, blog, onConfirm }: BlogDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!blog) return;
    setIsDeleting(true);
    try {
      await onConfirm(blog.id);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by parent, we just stop loading
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
            Delete Blog Post?
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 text-center">
          <p className="text-gray-500 font-medium text-sm">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          {blog && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left border border-gray-100">
              {/* Not `truncate`: its no-wrap line set the width of the
                  dialog's grid column, so a long title widened the column past
                  the dialog and clipped the message and the Delete button.
                  Wrapping lets it fit; two lines max, full title on hover.
                  wrap-anywhere also breaks a single unbroken word (a pasted
                  URL), which would otherwise force the same overflow. */}
              <p
                title={blog.title}
                className="font-bold text-gray-800 text-sm line-clamp-2 wrap-anywhere"
              >
                {blog.title}
              </p>
            </div>
          )}
        </div>

        {/* m-0 cancels DialogFooter's built-in -mx-4 -mb-4, which exists to
            undo DialogContent's default p-4. This dialog sets p-0, so those
            negative margins pushed the footer past the dialog's bottom and
            sides, where overflow-hidden clipped its padding away. */}
        <DialogFooter className="m-0 px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, Delete Post"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
