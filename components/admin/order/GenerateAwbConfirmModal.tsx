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
import { Loader2, Truck, TriangleAlert } from "lucide-react";
import type { AwbFormValues } from "./awbFormSchema";

interface GenerateAwbConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  values: AwbFormValues | null;
  errorMessage: string | null;
}

export function GenerateAwbConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  values,
  errorMessage,
}: GenerateAwbConfirmModalProps) {
  if (!values) return null;

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        className="sm:max-w-md bg-white border border-[#914A8C]/20 shadow-xl rounded-2xl p-6"
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Generate AWB?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                This assigns a courier and schedules a pickup.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-neutral-500">Dimensions</div>
              <div className="font-bold text-neutral-900">
                {values.length} × {values.breadth} × {values.height} cm
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-500">Weight</div>
              <div className="font-bold text-neutral-900">{values.weight} kg</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
          <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            This can only be done once — the AWB cannot be regenerated from here afterwards.
            Double-check the weight before confirming.
          </span>
        </div>

        {errorMessage && (
          <div className="mt-3 p-2 bg-red-50 text-red-800 text-xs font-semibold rounded-lg text-center">
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
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Contacting Shiprocket…
              </>
            ) : (
              <>
                <Truck className="w-4 h-4 mr-2" /> Generate AWB
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
