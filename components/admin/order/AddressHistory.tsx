"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/hooks/useAuth";
import { UserRole } from "@/app/types/auth";
import { useRetryAddressSync } from "@/hooks/useOrders";
import { getErrorMessage } from "@/lib/utils";
import type {
  AddressChange,
  AddressSyncStatus,
  AdminOrderDetail,
  OrderAddressValues,
} from "@/app/types/order";
import { MarkAddressSyncedDialog } from "./MarkAddressSyncedDialog";

const FIELD_LABELS: [keyof OrderAddressValues, string][] = [
  ["name", "Recipient"],
  ["line1", "Address line 1"],
  ["line2", "Address line 2"],
  ["city", "City"],
  ["state", "State"],
  ["zip", "Pincode"],
  ["phone", "Phone"],
];

const STATUS_LABEL: Record<AddressSyncStatus, string> = {
  NOT_REQUIRED: "Saved",
  PENDING: "Waiting for Shiprocket",
  // ⚠️ 5 minutes = ADDRESS_SYNC_CLAIM_STALE_MS in the backend config/orderAddress.ts.
  SYNCING: "Sending to Shiprocket (a retry is possible after 5 minutes)",
  SYNCED: "Confirmed at Shiprocket",
  FAILED: "Shiprocket did not accept it",
  UNVERIFIED: "Sent, could not be confirmed",
  MANUAL: "Marked as synced by hand",
};

const STATUS_CLASS: Record<AddressSyncStatus, string> = {
  NOT_REQUIRED: "bg-neutral-100 text-neutral-700",
  PENDING: "bg-amber-100 text-amber-800",
  SYNCING: "bg-amber-100 text-amber-800",
  SYNCED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  UNVERIFIED: "bg-red-100 text-red-800",
  MANUAL: "bg-blue-100 text-blue-800",
};

// Changes that still block Generate AWB (the backend refuses while any of these exists).
// ⚠️ Keep in step with ADDRESS_SYNC_BLOCKING_STATUSES in the backend config/orderAddress.ts.
const OPEN: AddressSyncStatus[] = ["PENDING", "SYNCING", "FAILED", "UNVERIFIED"];

// ⚠️ The start of the text the backend stores (orderAddress.service.ts, AWB_DURING_CHANGE_MESSAGE)
// on a change that was made while the AWB was being booked.
const AWB_DURING_CHANGE_PREFIX = "The AWB was created while this change was being made";

function changedLines(change: AddressChange) {
  return FIELD_LABELS.filter(
    ([key]) => (change.before[key] ?? "") !== (change.after[key] ?? "")
  ).map(([key, label]) => (
    <li key={key} className="break-words">
      <span className="text-neutral-500">{label}: </span>
      <span className="line-through text-neutral-400">{change.before[key] || "—"}</span>
      {" → "}
      <span className="font-semibold text-neutral-900">{change.after[key] || "—"}</span>
    </li>
  ));
}

export function AddressHistory({ order }: { order: AdminOrderDetail }) {
  const history = order.addressHistory ?? [];
  const { user } = useAuth();
  // The Master admin is the ADMIN role. Hand-marking switches off the backend check, so it is
  // offered to Master admins only (a sub-admin can retry the sync but not mark it).
  const isMaster = user?.role === UserRole.ADMIN;
  const retry = useRetryAddressSync(order.id);
  // The newest change on screen when the hand-mark dialog was opened (null = closed).
  const [markSeq, setMarkSeq] = useState<number | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  if (history.length === 0) return null;

  const hasAwb = !!order.shipment.awbNumber;
  const hasOpen = !hasAwb && history.some((c) => OPEN.includes(c.syncStatus));
  const noShiprocketOrder = !order.shipment.shiprocketOrderId;

  const awbDuringChange = history.some((c) => c.syncError?.startsWith(AWB_DURING_CHANGE_PREFIX));

  const onRetry = async () => {
    setRetryError(null);
    try {
      const result = await retry.mutateAsync();
      if (result.status === "SYNCED") toast.success("Shiprocket has the new address");
      else if (result.status === "UNVERIFIED")
        toast.warning("Sent, but Shiprocket could not be read back to confirm it");
      else toast.warning(result.error ?? "Shiprocket did not accept the address");
    } catch (err) {
      setRetryError(getErrorMessage(err, "Failed to retry the sync"));
    }
  };

  return (
    <div className="pt-3 mt-1 border-t border-neutral-100 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
        Address history ({history.length})
      </p>

      {awbDuringChange && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          An address change was made while the AWB was being booked. Check that the label shows the
          new address.
        </p>
      )}

      {hasOpen && (
        <div className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-2">
          <p>
            Shiprocket may still hold the old address, so Generate AWB is blocked until it is
            confirmed.
            {noShiprocketOrder && " The Shiprocket order is not created yet: try again when the order shows Ready to ship."}
            {!isMaster && " If the retry keeps failing, ask a Master admin to confirm it by hand."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={retry.isPending || noShiprocketOrder}
              onClick={onRetry}
              className="rounded-lg bg-[#914A8C] hover:bg-[#7a3e75] text-white"
            >
              {retry.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Checking Shiprocket…
                </>
              ) : (
                "Retry sync"
              )}
            </Button>
            {isMaster && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={retry.isPending}
                onClick={() => setMarkSeq(history[0]!.seq)}
                className="rounded-lg"
              >
                Mark as synced by hand
              </Button>
            )}
          </div>
          {retryError && <p className="font-semibold">{retryError}</p>}
        </div>
      )}

      <ul className="space-y-3">
        {history.map((change) => (
          <li key={change.id} className="text-xs space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-neutral-900">
                {format(new Date(change.createdAt), "dd MMM yyyy, HH:mm")}
              </span>
              <span className="text-neutral-500 break-all">{change.changedByEmail}</span>
              <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_CLASS[change.syncStatus]}`}>
                {STATUS_LABEL[change.syncStatus]}
              </span>
            </div>
            <ul className="space-y-0.5 pl-1">{changedLines(change)}</ul>
            {change.syncError && <p className="text-red-700">{change.syncError}</p>}
            {change.syncNote && (
              <p className="text-neutral-600">
                Note{change.syncedByEmail ? ` (${change.syncedByEmail})` : ""}: {change.syncNote}
              </p>
            )}
          </li>
        ))}
      </ul>

      <MarkAddressSyncedDialog
        orderId={order.id}
        upToSeq={markSeq ?? 0}
        open={markSeq !== null}
        onOpenChange={(open) => {
          if (!open) setMarkSeq(null);
        }}
      />
    </div>
  );
}
