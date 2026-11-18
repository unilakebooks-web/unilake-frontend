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
import { Check, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import type { Coupon } from "@/app/types/coupon";

interface BulkCodesDialogProps {
  /** The coupons just created; the dialog is open while this is set. */
  coupons: Coupon[] | null;
  onClose: () => void;
}

/** The download link is released after a moment, once the browser has started the download. */
const REVOKE_DELAY_MS = 1000;
/** The code box is at least this many lines tall, and grows with the batch up to MAX_ROWS. */
const MIN_ROWS = 4;
const MAX_ROWS = 12;

/**
 * A CSV field: quoted, with quotes doubled, so a comma or quote in a name cannot break the row.
 * A value starting with = + - or @ would be run as a formula by a spreadsheet, so it gets a
 * leading apostrophe.
 */
const csvField = (value: string) => {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

/**
 * Shows the codes of a batch of single-use coupons right after they are created, with
 * the two things an admin does next: copy them, or download them as a CSV file.
 * They also stay in the coupon list afterwards.
 */
export function BulkCodesDialog({ coupons, onClose }: BulkCodesDialogProps) {
  if (coupons === null) return null;
  const codes = coupons.map((coupon) => coupon.code);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      toast.success(`${codes.length} codes copied`);
    } catch {
      toast.error("Could not copy. Select the codes in the box and copy them by hand.");
    }
  };

  const handleDownload = () => {
    const rows = ["Code,Name", ...coupons.map((coupon) => `${csvField(coupon.code)},${csvField(coupon.name)}`)];
    // The byte order mark makes Excel read names with ₹ or Devanagari as UTF-8.
    const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `coupon-codes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-[#914A8C]/20 shadow-xl rounded-2xl p-6 grid-cols-[minmax(0,1fr)]">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">{coupons.length} codes created</DialogTitle>
              <DialogDescription className="text-[13px] text-neutral-600 font-medium">
                Each one works once. You can find them in the coupon list too.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <textarea
          readOnly
          aria-label="The created codes"
          value={codes.join("\n")}
          rows={Math.min(Math.max(codes.length, MIN_ROWS), MAX_ROWS)}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 p-3 font-mono text-sm text-neutral-800"
        />

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100 flex-wrap -mx-6 -mb-6 px-6 rounded-b-2xl">
          <Button type="button" variant="outline" onClick={handleDownload} className="rounded-xl h-10 px-5 font-semibold cursor-pointer">
            <Download className="w-4 h-4" />
            Download CSV
          </Button>
          <Button type="button" onClick={handleCopy} className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold h-10 px-5 cursor-pointer">
            <Copy className="w-4 h-4" />
            Copy all
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
