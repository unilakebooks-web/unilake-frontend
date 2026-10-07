"use client";

import Link from "next/link";
import type { OrderStatus } from "@/app/types/order";
import { ORDER_STATUSES } from "@/app/types/order";

/**
 * How many orders sit at each stage of the pipeline, right now.
 *
 * Labelled rows with proportional bars, NOT a donut. There are nine statuses,
 * which is well past what colour alone can encode — a reader would be matching
 * nine legend swatches against nine wedges. Rows carry the label, the count and
 * the bar together, so nothing depends on telling two colours apart.
 *
 * Bar colours are the badge palette from OrderStatusBadge, so red and amber
 * mean the same thing here as they do on the orders table. They are decoration
 * on top of a label, never the only carrier of meaning.
 *
 * Deliberately NOT filtered by the page's date range: this is a snapshot of
 * where work is sitting, and an order that has been stuck at READY_TO_SHIP for
 * six weeks is exactly the one that must not disappear behind a 7-day filter.
 */

const BAR_STYLES: Record<OrderStatus, string> = {
  CREATED: "bg-neutral-300",
  PAID: "bg-sky-400",
  GENERATED: "bg-indigo-400",
  CONFIRMED: "bg-violet-400",
  SHIPROCKET_FAILED: "bg-red-500",
  READY_TO_SHIP: "bg-amber-400",
  SHIPPED: "bg-blue-400",
  DELIVERED: "bg-emerald-400",
  CANCELLED: "bg-neutral-200",
};

const LABELS: Record<OrderStatus, string> = {
  CREATED: "Awaiting payment",
  PAID: "Paid",
  GENERATED: "Awaiting selection",
  CONFIRMED: "Confirmed",
  SHIPROCKET_FAILED: "Shiprocket failed",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function StatusBreakdown({
  ordersByStatus,
}: {
  ordersByStatus: Record<OrderStatus, number>;
}) {
  // Zero-count stages are dropped — a pipeline view should show where work
  // actually is, not nine rows of which six are empty.
  const rows = ORDER_STATUSES.filter((status) => ordersByStatus[status] > 0);

  const total = rows.reduce((sum, status) => sum + ordersByStatus[status], 0);

  if (total === 0) {
    return (
      <p className="text-sm text-neutral-500 py-6 text-center">
        No orders yet.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {rows.map((status) => {
        const count = ordersByStatus[status];
        const share = (count / total) * 100;

        return (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className="block group"
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs font-semibold text-neutral-700 truncate group-hover:text-[#914A8C] transition-colors">
                {LABELS[status]}
              </span>
              <span className="text-xs font-bold text-neutral-900 tabular-nums shrink-0">
                {count}
              </span>
            </div>
            {/* Track and fill share a rounded end so the bar reads as a
                proportion of the whole rather than a free-floating mark. */}
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${BAR_STYLES[status]}`}
                style={{ width: `${Math.max(share, 2)}%` }}
              />
            </div>
          </Link>
        );
      })}

      <p className="text-[11px] text-neutral-400 pt-1">
        Live totals — not affected by the date range.
      </p>
    </div>
  );
}
