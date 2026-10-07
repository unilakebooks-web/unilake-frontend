"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { LineChart } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { StatsTimeseries } from "@/app/types/stats";
import { formatMoney, cn } from "@/lib/utils";

/**
 * Orders / revenue over time.
 *
 * ONE MEASURE AT A TIME, by design. Orders are a count and revenue is money —
 * two different scales. Putting both on one plot would need a second y-axis,
 * and a dual-axis chart lets you imply any correlation you like by sliding one
 * scale against the other. The toggle costs a click and cannot lie.
 *
 * Single series, so:
 *   - area rather than line (area is the right form for one series over time)
 *   - one hue, from --chart-1 (the brand purple)
 *   - NO legend — the toggle already names what is drawn
 *
 * Buckets arrive zero-filled from the backend, cut on IST day boundaries, so
 * this component never has to distinguish "no data" from "a quiet day".
 */

type Measure = "orders" | "revenue";

/**
 * Axis ticks only — always compact, never the full figure.
 *
 * `formatMoneyCompact` deliberately falls back to the full format below
 * ₹1,00,000, which is right for a stat tile and wrong here: "₹12,500.00" is
 * about 80px of text in a 56px gutter, so ticks would clip or shove the plot
 * area around as the data changed. An axis label is a reference point, not a
 * figure to read exactly — the tooltip carries the precise number.
 */
function axisMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(value);
  }
}

export function OrdersTrendChart({ data }: { data: StatsTimeseries }) {
  const [measure, setMeasure] = useState<Measure>("orders");

  // Points come per currency. Rendering two revenue series on one axis would
  // be the dual-axis problem again in a different coat, so pick the busiest
  // currency and chart that. Only INR is active today.
  const currency = useMemo(() => {
    const totals = new Map<string, number>();
    for (const point of data.points) {
      totals.set(point.currency, (totals.get(point.currency) ?? 0) + point.orders);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [data.points]);

  const rows = useMemo(
    () =>
      data.points
        .filter((point) => point.currency === currency)
        .map((point) => ({
          date: point.date,
          orders: point.orders,
          revenue: parseFloat(point.revenue),
        })),
    [data.points, currency]
  );

  const hasAnyData = rows.some((row) => row.orders > 0);

  const tickFormat = data.granularity === "month" ? "MMM yy" : "MMM d";

  const chartConfig = {
    orders: { label: "Orders", color: "var(--chart-1)" },
    revenue: { label: "Revenue", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  if (data.points.length === 0 || !hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-14">
        <LineChart className="w-8 h-8 text-[#914A8C]/30 mb-3" />
        <p className="font-bold text-neutral-900 mb-1">Not enough data yet</p>
        <p className="text-sm text-neutral-500 max-w-xs">
          No paid orders in this period. The chart fills in as orders come
          through.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <div className="inline-flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
          {(["orders", "revenue"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={measure === option}
              onClick={() => setMeasure(option)}
              className={cn(
                "px-3 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors",
                measure === option
                  ? "bg-white shadow-sm text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-65 w-full">
        <AreaChart data={rows} margin={{ left: 4, right: 12, top: 8 }}>
          <defs>
            <linearGradient id="overviewTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--chart-1)"
                stopOpacity={0.28}
              />
              <stop
                offset="100%"
                stopColor="var(--chart-1)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>

          {/* Recessive grid — horizontal only. Vertical rules add ink without
              helping anyone read a value off the y-axis. */}
          <CartesianGrid vertical={false} strokeDasharray="3 3" />

          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(value: string) =>
              format(parseISO(value), tickFormat)
            }
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={measure === "revenue" ? 56 : 32}
            allowDecimals={false}
            tickFormatter={(value: number) =>
              measure === "revenue" && currency
                ? axisMoney(value, currency)
                : String(value)
            }
          />

          {/* The hover layer is not optional on a time series — without it the
              only way to read a specific day is to squint at the axis. */}
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) =>
                  format(
                    parseISO(String(value)),
                    data.granularity === "month" ? "MMMM yyyy" : "EEE, MMM d"
                  )
                }
                formatter={(value) =>
                  measure === "revenue" && currency
                    ? formatMoney(String(value), currency)
                    : `${value} ${Number(value) === 1 ? "order" : "orders"}`
                }
              />
            }
          />

          <Area
            dataKey={measure}
            type="monotone"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#overviewTrendFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
