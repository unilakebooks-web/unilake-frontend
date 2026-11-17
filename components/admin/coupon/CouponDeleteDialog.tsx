"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Loader2, Trash2 } from "lucide-react";
import type { Coupon } from "@/app/types/coupon";
import { getErrorMessage } from "@/lib/utils";

interface CouponDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  onConfirm: (id: string) => Promise<void>;
  /** Turns the coupon off, offered instead of deleting a coupon that has been used. */
  onDeactivate: (coupon: Coupon) => Promise<void>;
}

export function CouponDeleteDialog({
  open,
  onOpenChange,
  coupon,
  onConfirm,
  onDeactivate,
}: CouponDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  // Set when the server refused the delete: a lapsed or released use also blocks it.
  const [deleteRefused, setDeleteRefused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!coupon) return null;

  // A coupon that was used or is held by a customer in checkout cannot be deleted.
  const timesUsed = coupon.usage.redeemed + coupon.usage.reserved;

  const isBusy = isDeleting || isDeactivating;

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    setErrorMessage(null);
    try {
      await onDeactivate(coupon);
      onOpenChange(false);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Failed to turn the coupon off"));
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    setDeleteRefused(false);
    try {
      await onConfirm(coupon.id);
      onOpenChange(false);
    } catch (err) {
      // A coupon that has been used cannot be deleted; the server says so and
      // suggests deactivating it instead.
      setErrorMessage(getErrorMessage(err, "Failed to delete coupon"));
      setDeleteRefused(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isBusy ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-red-200 shadow-xl rounded-2xl p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Delete Coupon?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                This action is permanent. A coupon that has been used cannot be deleted; turn it off instead.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700">
          <p className="text-sm font-bold font-mono">{coupon.code}</p>
          <p className="text-xs text-neutral-500">{coupon.name}</p>
        </div>

        {timesUsed > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold leading-relaxed">
            This coupon has been used or is held in a checkout ({timesUsed} time{timesUsed === 1 ? "" : "s"}), so it cannot be
            deleted. Turn it off instead: customers can no longer use it, and the history stays.
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
            className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-5 cursor-pointer"
          >
            Cancel
          </Button>
          {(timesUsed > 0 || deleteRefused) && coupon.isActive && (
            <Button
              type="button"
              onClick={handleDeactivate}
              disabled={isBusy}
              className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-semibold h-10 px-5 cursor-pointer"
            >
              {isDeactivating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Turning off...
                </>
              ) : (
                "Turn off instead"
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isBusy || timesUsed > 0}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold h-10 px-5 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
