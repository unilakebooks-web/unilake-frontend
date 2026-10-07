import api from "@/app/lib/axios";
import type {
  ContentHealth,
  StatsRange,
  StatsSummary,
  StatsTimeseries,
} from "@/app/types/stats";

// ============================================================
// ADMIN OVERVIEW (/api/admin/stats)
// ============================================================
//
// Three calls rather than one so the dashboard can render progressively — the
// triage band paints off /summary without waiting on the chart, and one failing
// aggregate degrades a single panel instead of blanking the page.
//
// The axios interceptor in app/lib/axios.ts already unwraps the
// { success, data } envelope, so these return the payload directly.

export async function fetchStatsSummary(
  range: StatsRange
): Promise<StatsSummary> {
  const { data } = await api.get<StatsSummary>(
    `/api/admin/stats/summary?range=${range}`
  );
  return data;
}

export async function fetchStatsTimeseries(
  range: StatsRange
): Promise<StatsTimeseries> {
  const { data } = await api.get<StatsTimeseries>(
    `/api/admin/stats/timeseries?range=${range}`
  );
  return data;
}

// No range parameter — storefront configuration is always a statement about
// right now, and nothing on it varies with a date window.
export async function fetchContentHealth(): Promise<ContentHealth> {
  const { data } = await api.get<ContentHealth>(
    "/api/admin/stats/content-health"
  );
  return data;
}
