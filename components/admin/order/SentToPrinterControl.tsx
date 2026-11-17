"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetSentToPrinter } from "@/hooks/useOrders";
import { getErrorMessage } from "@/lib/utils";
import type { AdminOrderDetail } from "@/app/types/order";
import { SentToPrinterUndoDialog } from "./SentToPrinterUndoDialog";

export function SentToPrinterControl({ order }: { order: AdminOrderDetail }) {
  const mutation = useSetSentToPrinter(order.id);
  const [undoOpen, setUndoOpen] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const sentAt = order.timestamps.sentToPrinterAt;

  const handleMark = () => {
    mutation.mutate(true, {
      onSuccess: () => toast.success("Marked as sent to printer."),
      onError: (err) => toast.error(getErrorMessage(err, "Couldn't mark as sent to printer.")),
    });
  };

  const handleUndo = () => {
    setUndoError(null);
    mutation.mutate(false, {
      onSuccess: () => {
        setUndoOpen(false);
        toast.success("Sent to printer date removed.");
      },
      onError: (err) => setUndoError(getErrorMessage(err, "Couldn't remove the date.")),
    });
  };

  if (sentAt) {
    return (
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100">
        <p className="text-sm text-neutral-700">
          Sent to printer on {format(new Date(sentAt), "MMM d, yyyy, h:mm a")}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setUndoError(null);
            setUndoOpen(true);
          }}
          className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-9 px-4 shrink-0"
        >
          Undo
        </Button>
        <SentToPrinterUndoDialog
          open={undoOpen}
          onOpenChange={setUndoOpen}
          onConfirm={handleUndo}
          isPending={mutation.isPending}
          errorMessage={undoError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5 pt-2 border-t border-neutral-100">
      <Button
        type="button"
        variant="outline"
        onClick={handleMark}
        disabled={!order.canMarkSentToPrinter || mutation.isPending}
        className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-4"
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Marking…
          </>
        ) : (
          <>
            <Printer className="w-4 h-4 mr-2" /> Mark as sent to printer
          </>
        )}
      </Button>
      {!order.canMarkSentToPrinter && (
        <p className="text-xs text-neutral-400">Available once the print-ready PDF is compiled</p>
      )}
    </div>
  );
}
