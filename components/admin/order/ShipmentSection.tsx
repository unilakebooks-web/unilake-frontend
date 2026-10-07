"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ExternalLink,
  FileDown,
  Loader2,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrderLabel, useRefreshTracking, useRetryShiprocket } from "@/hooks/useOrders";
import type { AdminOrderDetail, RefreshTrackingResponse } from "@/app/types/order";
import { GenerateAwbForm } from "./GenerateAwbForm";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className="font-semibold text-neutral-900 text-right break-all min-w-0">
        {value ?? <span className="text-neutral-400 font-normal">—</span>}
      </span>
    </div>
  );
}

function fmt(date: string | null) {
  return date ? format(new Date(date), "MMM d, yyyy · h:mm a") : null;
}

export function ShipmentSection({ order }: { order: AdminOrderDetail }) {
  const { shipment, dimensions, timestamps, status } = order;

  const retry = useRetryShiprocket(order.id);
  const label = useOrderLabel(order.id);
  const tracking = useRefreshTracking(order.id);

  const [trackingResult, setTrackingResult] = useState<RefreshTrackingResponse | null>(null);

  // These mirror the backend's guards exactly (shiprocket.service.ts). Rendering a
  // button whose preconditions don't hold would just produce a guaranteed 409, so
  // each action is gated on the same conditions the server checks.
  const phaseADone = !!shipment.shiprocketOrderId && !!shipment.shiprocketShipmentId;
  const canGenerateAwb = status === "READY_TO_SHIP" && phaseADone && !shipment.awbNumber;
  const canRetry = status === "SHIPROCKET_FAILED";
  const canGetLabel =
    !!shipment.awbNumber &&
    !!shipment.shiprocketShipmentId &&
    ["READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(status);
  const canRefreshTracking = !!shipment.awbNumber;

  const handleRetry = async () => {
    try {
      const result = await retry.mutateAsync();
      toast.success(
        result.recovered
          ? "Recovered — Shiprocket already had this shipment, our records are now reconciled."
          : "Shiprocket retry succeeded — the order is ready to ship."
      );
    } catch (err) {
      const { message } = (err ?? {}) as { message?: string };
      toast.error(message ?? "Retry failed.");
    }
  };

  const handleLabel = async () => {
    try {
      const result = await label.mutateAsync();
      window.open(result.labelUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      const { message } = (err ?? {}) as { message?: string };
      toast.error(message ?? "Could not generate the label.");
    }
  };

  const handleRefreshTracking = async () => {
    try {
      const result = await tracking.mutateAsync();
      setTrackingResult(result);

      // "pending" means Shiprocket has no courier scans yet — normal right after
      // AWB assignment, so it's a neutral message rather than an error.
      if (result.shiprocket.state === "pending") {
        toast.info("No courier scans yet — tracking will populate once the parcel moves.");
        return;
      }

      const changed = Object.values(result.updated).some((v) => v !== null);
      toast.success(
        changed ? "Tracking refreshed — records updated." : "Tracking refreshed — nothing changed."
      );
    } catch (err) {
      const { message } = (err ?? {}) as { message?: string };
      toast.error(message ?? "Could not refresh tracking.");
    }
  };

  // Shown when no action is available, so the page explains itself rather than
  // presenting a dead button.
  const idleExplanation = (() => {
    if (canGenerateAwb || canRetry || canGetLabel || canRefreshTracking) return null;
    switch (status) {
      case "CREATED":
        return "Waiting on payment. Nothing to ship yet.";
      case "PAID":
      case "GENERATED":
        return "The customer hasn't sent this book to print yet.";
      case "CONFIRMED":
        return "PDF compilation and Shiprocket registration are still in progress.";
      case "CANCELLED":
        return "This order was cancelled — no shipment actions are available.";
      default:
        return "No shipment actions are available for this order right now.";
    }
  })();

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2 text-[#914A8C]">
        <Truck className="w-4 h-4" />
        <h2 className="font-bold uppercase text-xs tracking-wider">Shipment</h2>
        {shipment.isInternational && (
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            INTERNATIONAL
          </span>
        )}
      </div>

      <div className="grid gap-x-8 gap-y-2.5 md:grid-cols-2">
        <Field
          label="Shiprocket order"
          value={shipment.shiprocketOrderId && <span className="font-mono text-xs">{shipment.shiprocketOrderId}</span>}
        />
        <Field
          label="Shipment ID"
          value={shipment.shiprocketShipmentId && <span className="font-mono text-xs">{shipment.shiprocketShipmentId}</span>}
        />
        <Field
          label="AWB"
          value={shipment.awbNumber && <span className="font-mono text-xs">{shipment.awbNumber}</span>}
        />
        <Field label="Courier" value={shipment.courierName} />
        <Field label="Tracking status (raw)" value={shipment.trackingStatus} />
        <Field label="Tracking updated" value={fmt(shipment.trackingUpdatedAt)} />
        {shipment.trackingUrl && (
          <Field
            label="Tracking page"
            value={
              <a
                href={shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#914A8C] hover:underline inline-flex items-center gap-1"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            }
          />
        )}
      </div>

      {(dimensions.finalLength !== null || dimensions.finalWeight !== null) && (
        <div className="grid gap-x-8 gap-y-2.5 md:grid-cols-2 pt-4 border-t border-neutral-100">
          <Field
            label="Final dimensions"
            value={
              dimensions.finalLength !== null
                ? `${dimensions.finalLength} × ${dimensions.finalBreadth} × ${dimensions.finalHeight} cm`
                : null
            }
          />
          <Field
            label="Final weight"
            value={dimensions.finalWeight !== null ? `${dimensions.finalWeight} kg` : null}
          />
        </div>
      )}

      <div className="grid gap-x-8 gap-y-2.5 md:grid-cols-2 pt-4 border-t border-neutral-100">
        <Field label="AWB generated" value={fmt(timestamps.awbGeneratedAt)} />
        <Field label="Label generated" value={fmt(timestamps.labelGeneratedAt)} />
        <Field label="Pickup scheduled" value={fmt(timestamps.pickupScheduledDate)} />
        <Field label="Pickup generated" value={fmt(timestamps.pickupGeneratedAt)} />
        <Field label="Shipped" value={fmt(timestamps.shippedAt)} />
        <Field label="Delivered" value={fmt(timestamps.deliveredAt)} />
      </div>

      {canGenerateAwb && <GenerateAwbForm order={order} />}

      {canRetry && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-5">
          <h3 className="font-bold text-neutral-900 mb-1">Shiprocket registration failed</h3>
          <p className="text-sm text-neutral-600 mb-4">
            This order never made it into Shiprocket. Retrying re-runs the registration; if
            Shiprocket already has the shipment, our records are reconciled instead.
          </p>
          <Button
            onClick={handleRetry}
            disabled={retry.isPending}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold h-11 px-6 shadow-sm"
          >
            {retry.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Retrying…
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" /> Retry Shiprocket
              </>
            )}
          </Button>
        </div>
      )}

      {(canGetLabel || canRefreshTracking) && (
        <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-100">
          {canGetLabel && (
            <Button
              variant="outline"
              onClick={handleLabel}
              disabled={label.isPending}
              className="rounded-xl border-neutral-300 font-semibold h-10 px-5 bg-white"
            >
              {label.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching label…
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" /> Download label
                </>
              )}
            </Button>
          )}
          {canRefreshTracking && (
            <Button
              variant="outline"
              onClick={handleRefreshTracking}
              disabled={tracking.isPending}
              className="rounded-xl border-neutral-300 font-semibold h-10 px-5 bg-white"
            >
              {tracking.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Refreshing…
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh tracking
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {idleExplanation && (
        <p className="text-sm text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
          {idleExplanation}
        </p>
      )}

      {trackingResult && trackingResult.shiprocket.activities.length > 0 && (
        <div className="pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2 mb-3 text-neutral-700">
            <PackageCheck className="w-4 h-4" />
            <h3 className="font-bold text-xs uppercase tracking-wider">Courier activity</h3>
          </div>
          <ol className="space-y-3">
            {trackingResult.shiprocket.activities.map((activity, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-[#914A8C] mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900">{activity.activity}</div>
                  <div className="text-xs text-neutral-500">
                    {[activity.location, activity.date ? fmt(activity.date) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
