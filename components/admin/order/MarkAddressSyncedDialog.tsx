"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMarkAddressSynced } from "@/hooks/useOrders";
import { getErrorMessage } from "@/lib/utils";

// ⚠️ Same minimum as markAddressSyncedBodySchema in the backend validators/order.schema.ts.
const MIN_NOTE = 10;

export function MarkAddressSyncedDialog({
  orderId,
  upToSeq,
  open,
  onOpenChange,
}: {
  orderId: string;
  /** The newest change on screen when this was opened: only changes up to it are marked. */
  upToSeq: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutateAsync, isPending } = useMarkAddressSynced(orderId);
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tooShort = note.trim().length < MIN_NOTE;

  const confirm = async () => {
    setErrorMessage(null);
    try {
      await mutateAsync({ note: note.trim(), upToSeq });
      setNote("");
      onOpenChange(false);
      toast.success("Marked as synced. Generate AWB is allowed again.");
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Failed to mark the address as synced"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        className="sm:max-w-md bg-white border border-[#914A8C]/20 shadow-xl rounded-2xl p-6"
      >
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-bold text-neutral-900">
            Mark the address as synced by hand
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500 font-medium">
            Only do this after you have checked in the Shiprocket panel that the order has the
            new address. It switches off the check that stops Generate AWB, and it is recorded
            with your name and the note below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5 mt-3">
          <Label htmlFor="sync-note" className="text-xs font-semibold text-neutral-700">
            What did you check? (at least {MIN_NOTE} characters)
          </Label>
          <Textarea
            id="sync-note"
            value={note}
            disabled={isPending}
            onChange={(e) => setNote(e.target.value)}
            // ⚠️ Same limit as markAddressSyncedBodySchema (backend validators/order.schema.ts).
            maxLength={500}
            className="rounded-xl bg-white border-neutral-200"
          />
        </div>

        {errorMessage && (
          <div className="mt-3 p-2 bg-red-50 text-red-800 text-xs font-semibold rounded-lg text-center">
            {errorMessage}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100 mt-4">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending || tooShort}
            onClick={confirm}
            className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
              </>
            ) : (
              "Mark as synced"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
