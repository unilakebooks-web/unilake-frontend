"use client";

import { useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Clock,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  useContentHealth,
  useStatsSummary,
  useStatsTimeseries,
} from "@/hooks/useStats";
import type { StatsRange } from "@/app/types/stats";
import { OverviewPageHeader } from "@/components/admin/overview/OverviewPageHeader";
import { RangeSelector } from "@/components/admin/overview/RangeSelector";
import { OverviewPanel } from "@/components/admin/overview/OverviewPanel";
import { KpiRow } from "@/components/admin/overview/KpiRow";
import { NeedsAttentionPanel } from "@/components/admin/overview/NeedsAttentionPanel";
import { OrdersTrendChart } from "@/components/admin/overview/OrdersTrendChart";
import { StatusBreakdown } from "@/components/admin/overview/StatusBreakdown";
import { RecentOrders } from "@/components/admin/overview/RecentOrders";
import { TopComics } from "@/components/admin/overview/TopComics";
import { StorefrontHealth } from "@/components/admin/overview/StorefrontHealth";

const RANGE_SUBTITLE: Record<StatsRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

/**
 * Admin dashboard.
 *
 * Three independent queries rather than one, so the bands paint as their data
 * arrives — the triage band does not wait on the chart, and a single failing
 * aggregate shows one retry card instead of blanking the page.
 *
 * The range drives summary and timeseries only. Content health has no date
 * dimension and its hook has no range in its query key, so switching presets
 * never refetches it.
 */
export default function OverviewPage() {
  const [range, setRange] = useState<StatsRange>("30d");

  const summaryQuery = useStatsSummary(range);
  const timeseriesQuery = useStatsTimeseries(range);
  const healthQuery = useContentHealth();

  return (
    <div className="space-y-5 max-w-6xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <OverviewPageHeader subtitle={RANGE_SUBTITLE[range]} />
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {/* Band 1 — KPIs. Handles its own loading inside each tile so the row
          keeps its shape rather than collapsing to a spinner. */}
      <KpiRow summary={summaryQuery.data} isLoading={summaryQuery.isLoading} />

      {/* Band 2 — triage. First thing below the fold-line for a reason. */}
      <OverviewPanel
        title="Needs attention"
        icon={TriangleAlert}
        isLoading={summaryQuery.isLoading}
        error={summaryQuery.error}
        onRetry={() => summaryQuery.refetch()}
        skeletonRows={2}
      >
        {summaryQuery.data && (
          <NeedsAttentionPanel
            needsAttention={summaryQuery.data.needsAttention}
          />
        )}
      </OverviewPanel>

      {/* Band 3 — trend + pipeline. Separate queries, so the chart can fail
          without taking the status breakdown with it. */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <OverviewPanel
          title="Orders over time"
          icon={BarChart3}
          className="lg:col-span-3"
          isLoading={timeseriesQuery.isLoading}
          error={timeseriesQuery.error}
          onRetry={() => timeseriesQuery.refetch()}
          skeletonRows={5}
        >
          {timeseriesQuery.data && (
            <OrdersTrendChart data={timeseriesQuery.data} />
          )}
        </OverviewPanel>

        <OverviewPanel
          title="Order pipeline"
          icon={Activity}
          className="lg:col-span-2"
          isLoading={summaryQuery.isLoading}
          error={summaryQuery.error}
          onRetry={() => summaryQuery.refetch()}
          skeletonRows={5}
        >
          {summaryQuery.data && (
            <StatusBreakdown ordersByStatus={summaryQuery.data.ordersByStatus} />
          )}
        </OverviewPanel>
      </div>

      {/* Band 4 — recent activity + best sellers. */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <OverviewPanel
          title="Recent orders"
          icon={Clock}
          className="lg:col-span-3"
          isLoading={summaryQuery.isLoading}
          error={summaryQuery.error}
          onRetry={() => summaryQuery.refetch()}
          skeletonRows={4}
        >
          {summaryQuery.data && (
            <RecentOrders orders={summaryQuery.data.recentOrders} />
          )}
        </OverviewPanel>

        <OverviewPanel
          title="Best sellers"
          icon={BookOpen}
          className="lg:col-span-2"
          isLoading={summaryQuery.isLoading}
          error={summaryQuery.error}
          onRetry={() => summaryQuery.refetch()}
          skeletonRows={4}
        >
          {summaryQuery.data && (
            <TopComics comics={summaryQuery.data.topComics} />
          )}
        </OverviewPanel>
      </div>

      {/* Band 5 — storefront config. Independent query, no range. */}
      <OverviewPanel
        title="Storefront health"
        icon={ShieldCheck}
        isLoading={healthQuery.isLoading}
        error={healthQuery.error}
        onRetry={() => healthQuery.refetch()}
        skeletonRows={4}
      >
        {healthQuery.data && <StorefrontHealth health={healthQuery.data} />}
      </OverviewPanel>
    </div>
  );
}
