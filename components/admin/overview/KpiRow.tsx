"use client";

import { AlertTriangle, IndianRupee, Receipt, ShoppingBag } from "lucide-react";
import type { StatsSummary } from "@/app/types/stats";
import { formatMoney, formatMoneyCompact } from "@/lib/utils";
import { StatTile } from "./StatTile";

/**
 * Picks which currency a tile leads with.
 *
 * `revenue` is an array because totals are never summed across currencies. Only
 * INR is active today so this almost always has one entry, but when a second
 * market is switched on the busiest currency leads and the rest move to the
 * supporting line — which is honest, where an added-together number would not be.
 */
function primaryBucket<T extends { orderCount: number }>(
  buckets: T[]
): T | undefined {
  if (buckets.length === 0) return undefined;
  return [...buckets].sort((a, b) => b.orderCount - a.orderCount)[0];
}

function secondaryCurrencies(
  buckets: { currency: string; total: string }[],
  primaryCurrency: string | undefined
): string {
  return buckets
    .filter((bucket) => bucket.currency !== primaryCurrency)
    .map((bucket) => formatMoneyCompact(bucket.total, bucket.currency))
    .join(" · ");
}

const RANGE_LABEL: Record<string, string> = {
  "7d": "last 7 days",
  "30d": "last 30 days",
  all: "all time",
};

export function KpiRow({
  summary,
  isLoading,
}: {
  summary: StatsSummary | undefined;
  isLoading: boolean;
}) {
  const revenue = primaryBucket(summary?.revenue ?? []);
  const lifetime = primaryBucket(summary?.lifetime ?? []);

  const otherCurrencies = secondaryCurrencies(
    summary?.revenue ?? [],
    revenue?.currency
  );

  const attention = summary?.needsAttention;

  // Only the two counts that genuinely need an admin to act. Awaiting-selection
  // is the customer's move and abandoned checkouts are nobody's fault, so
  // neither belongs in a number meant to read as a to-do list.
  const actionableCount = attention
    ? attention.shiprocketFailed + attention.awaitingDimensions
    : 0;

  const covers = summary?.coverTypeSplit;
  const coverTotal = covers ? covers.HARDCOVER + covers.SOFTCOVER : 0;
  const hardcoverShare =
    coverTotal > 0 && covers
      ? Math.round((covers.HARDCOVER / coverTotal) * 100)
      : null;

  const rangeLabel = summary ? (RANGE_LABEL[summary.range] ?? "") : "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatTile
        isLoading={isLoading}
        icon={IndianRupee}
        label="Revenue"
        value={revenue ? formatMoneyCompact(revenue.total, revenue.currency) : "—"}
        sub={
          otherCurrencies
            ? `plus ${otherCurrencies}`
            : lifetime
              ? `${formatMoneyCompact(lifetime.total, lifetime.currency)} all time`
              : undefined
        }
      />

      <StatTile
        isLoading={isLoading}
        icon={ShoppingBag}
        label="Paid orders"
        value={revenue ? String(revenue.orderCount) : "0"}
        sub={
          lifetime ? `${lifetime.orderCount} all time` : `in the ${rangeLabel}`
        }
      />

      <StatTile
        isLoading={isLoading}
        icon={Receipt}
        label="Avg order value"
        value={
          revenue && revenue.orderCount > 0
            ? formatMoney(revenue.averageOrderValue, revenue.currency)
            : "—"
        }
        sub={
          hardcoverShare !== null
            ? `${hardcoverShare}% hardcover`
            : "No paid orders yet"
        }
      />

      <StatTile
        isLoading={isLoading}
        icon={AlertTriangle}
        label="Needs attention"
        value={String(actionableCount)}
        tone={actionableCount > 0 ? "alert" : "default"}
        sub={
          actionableCount > 0
            ? "Orders waiting on you"
            : "Nothing waiting on you"
        }
        href={actionableCount > 0 ? "/admin/orders" : undefined}
      />
    </div>
  );
}
