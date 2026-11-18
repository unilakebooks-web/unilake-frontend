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
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminOrderPage } from "@/app/types/order";

interface RegeneratePagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "restart": the pages below. "finish": every page is ready, move the order on. */
  mode: "restart" | "finish";
  pages: AdminOrderPage[];
  /** Why every restartable page is restarted together: the book failed, or its payment's pages were never started. */
  groupReason: "failed" | "stalled" | null;
  /** Some page that will be restarted needs "Restart anyway" (a restore restarts every failed page). */
  needsForce: boolean;
  onConfirm: () => void;
  isPending: boolean;
  errorMessage: string | null;
}

// "1–5, 8, 10–12": consecutive page numbers collapsed, so a long list stays readable.
function pageList(pages: AdminOrderPage[]) {
  const numbers = pages.map((p) => p.pageNumber).sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < numbers.length;) {
    let j = i;
    while (j + 1 < numbers.length && numbers[j + 1] === numbers[j] + 1) j++;
    parts.push(j > i ? `${numbers[i]}–${numbers[j]}` : `${numbers[i]}`);
    i = j + 1;
  }
  return parts.join(", ");
}

export function RegeneratePagesDialog({
  open,
  onOpenChange,
  mode,
  pages,
  groupReason,
  needsForce,
  onConfirm,
  isPending,
  errorMessage,
}: RegeneratePagesDialogProps) {
  const imagePages = pages.filter((p) => p.usesImageService).length;
  const usesImageService = imagePages > 0;
  const anyForced = needsForce;
  const count = pages.length;

  const title =
    mode === "finish"
      ? "Tell the customer their book is ready?"
      : count === 1
        ? `Restart page ${pages[0]?.pageNumber}?`
        : `Restart ${count} pages?`;

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        className="sm:max-w-md max-h-[90dvh] overflow-y-auto bg-white border border-[#914A8C]/20 shadow-xl rounded-2xl p-6"
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              {mode === "finish" ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <RotateCcw className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold text-neutral-900 break-words pr-8">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                {mode === "finish"
                  ? "This sends the customer the “your book is ready” email."
                  : "The customer is not charged and finished pages are not touched."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-3 space-y-3 text-sm text-neutral-700 leading-relaxed">
          {mode === "finish" ? (
            <p>
              All pages are ready, but the order never moved on, so the customer
              cannot choose their pages or print yet. This marks the book as
              ready and emails them. It cannot be undone.
            </p>
          ) : (
            <>
              {count > 1 && (
                <p className="text-sm font-semibold text-neutral-800">
                  Pages: {pageList(pages)}
                </p>
              )}
              {usesImageService && (
                <p>
                  {imagePages === 1
                    ? "This page is made by the image service (RunPod)."
                    : "These pages are made by the image service (RunPod)."}{" "}
                  If the first attempt is still running there, restarting can
                  use credit twice, and the first result is thrown away. That is
                  about 1.4 US cents per page
                  {imagePages > 1
                    ? `, up to about ${(imagePages * 1.4).toFixed(0)} US cents for these ${imagePages} pages`
                    : ""}
                  . If the account has no credit left, the restart will fail
                  again; the balance is not shown here.
                </p>
              )}
              {groupReason === "failed" && (
                <p>
                  Because the book failed, every failed page is restarted
                  together, so that the customer is only told the book is ready
                  when it is.
                </p>
              )}
              {groupReason === "stalled" && (
                <p>
                  This payment&rsquo;s pages were never started, so all of them
                  are started together.
                </p>
              )}
              {anyForced && (
                <p className="font-semibold text-amber-800">
                  Some of these pages were restarted or failed only a few
                  minutes ago, or may still be running. Restarting them now may
                  repeat work that is still in progress.
                </p>
              )}
              <p>
                The customer&rsquo;s book updates by itself when the pages are
                ready. Keep this tab open until they are.
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
            className={cn(
              "rounded-xl text-white font-semibold h-10 px-5 shadow-sm",
              mode === "restart" && anyForced
                ? "bg-amber-700 hover:bg-amber-800"
                : "bg-[#914A8C] hover:bg-[#7a3e75]",
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                {mode === "finish" ? "Sending…" : "Restarting…"}
              </>
            ) : mode === "finish" ? (
              "Mark ready and email customer"
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
