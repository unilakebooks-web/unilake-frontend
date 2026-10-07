"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { PackageSearch } from "lucide-react";
import type { OverviewOrderRow } from "@/app/types/stats";
import { OrderStatusBadge } from "@/components/admin/order/OrderStatusBadge";

/**
 * The last handful of orders, newest first.
 *
 * Always current regardless of the selected range — this is the "what just
 * happened" list, not a report. Reuses OrderStatusBadge so a status reads
 * identically here and on the orders table.
 *
 * Amounts stay in the `{currency} {amount}` form the orders table uses rather
 * than going through formatMoney: in a column of aligned figures, bare grouped
 * numbers are easier to scan than a column of repeated symbols.
 */
export function RecentOrders({ orders }: { orders: OverviewOrderRow[] }) {
  const router = useRouter();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <PackageSearch className="w-8 h-8 text-[#914A8C]/30 mb-3" />
        <p className="font-bold text-neutral-900 mb-1">No orders yet</p>
        <p className="text-sm text-neutral-500">
          New orders will appear here as they come in.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100 -mx-1">
      {orders.map((order) => (
        <div
          key={order.id}
          onClick={() => router.push(`/admin/orders/${order.id}`)}
          className="flex items-center justify-between gap-3 px-1 py-2.5 hover:bg-white/60 rounded-lg transition-colors cursor-pointer"
        >
          <div className="min-w-0">
            <div className="font-bold text-sm text-neutral-900 truncate">
              {order.comicTitle}
            </div>
            <div className="text-xs text-neutral-500 truncate">
              {order.childName ? `for ${order.childName} · ` : ""}
              {format(new Date(order.createdAt), "MMM d")}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-neutral-900 tabular-nums whitespace-nowrap hidden sm:inline">
              {order.currency} {order.amount}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      ))}

      <div className="pt-3 px-1">
        <Link
          href="/admin/orders"
          className="text-xs font-bold text-[#914A8C] hover:underline"
        >
          View all orders →
        </Link>
      </div>
    </div>
  );
}
