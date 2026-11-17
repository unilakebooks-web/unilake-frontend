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
import { Loader2, RotateCcw } from "lucide-react";
import type { AdminOrderPage } from "@/app/types/order";

interface RegeneratePagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "restart": the pages below. "finish": every page is ready, move the order on. */
  mode: "restart" | "finish";
  pages: AdminOrderPage[];
  /** The session failed after payment, so every failed page is restarted, not only these. */
  restoresSession: boolean;
  /** Some page that will be restarted needs "Restart anyway" (a restore restarts every failed page). */
  needsForce: boolean;
  onConfirm: () => void;
  isPending: boolean;
  errorMessage: string | null;
}

function pageList(pages: AdminOrderPage[]) {
  return pages.map((p) => p.pageNumber).join(", ");
}

export function RegeneratePagesDialog({
  open,
  onOpenChange,
  mode,
  pages,
  restoresSession,
  needsForce,
  onConfirm,
  isPending,
  errorMessage,
}: RegeneratePagesDialogProps) {
  const usesImageService = pages.some((p) => p.usesImageService);
  const anyForced = needsForce;
  const count = pages.length;

  const title =
    mode === "finish"
      ? "Finish this order?"
      : `Restart ${count} page${count === 1 ? "" : "s"} (${pageList(pages)})?`;

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white border border-[#914A8C]/20 shadow-xl rounded-2xl p-6"
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold text-neutral-900 break-words">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                The customer is not charged and finished pages are not touched.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-3 space-y-3 text-sm text-neutral-700 leading-relaxed">
          {mode === "finish" ? (
            <p>
              All pages are ready, but the order never moved on. This marks the
              book as ready and sends the customer the &ldquo;your book is
              ready&rdquo; email, so they can choose their pages and print.
            </p>
          ) : (
            <>
              {usesImageService && (
                <p>
                  These pages are made by the image service (RunPod). If the
                  first attempt is still running there, the restart can use
                  credit twice for that page (about 1.4 cents per page), and the
                  first result is thrown away. The credit balance is not shown
                  here: if it is empty the restart will fail again.
                </p>
              )}
              {restoresSession && (
                <p>
                  This restarts every failed page of the book, not just this
                  one, so that the customer is only told the book is ready when
                  it is.
                </p>
              )}
              {anyForced && (
                <p className="font-semibold text-amber-800">
                  Some of these pages were restarted or failed only a few
                  minutes ago, or may still be running. Restarting them now is
                  your call.
                </p>
              )}
              <p>
                The customer&rsquo;s book updates by itself when the pages are
                ready. Keep this page open until they are.
              </p>
            </>
          )}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-3 p-2 bg-red-50 text-red-800 text-xs font-semibold rounded-lg text-center"
          >
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
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                {mode === "finish" ? "Finishing…" : "Restarting…"}
              </>
            ) : mode === "finish" ? (
              "Finish order"
            ) : anyForced ? (
              "Restart anyway"
            ) : (
              "Restart"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
