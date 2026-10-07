import { useQuery } from "@tanstack/react-query";
import {
  fetchContentHealth,
  fetchStatsSummary,
  fetchStatsTimeseries,
} from "@/app/actions/stats";
import type { StatsRange } from "@/app/types/stats";

// Admin overview. Three separate queries on purpose — see the actions file.
//
// No refetchInterval anywhere: the admin layout's QueryClient already sets
// staleTime 30s and retry 1, so these revalidate when someone tabs back to the
// dashboard and stay quiet otherwise. Polling a dashboard nobody is looking at
// buys nothing.

/**
 * `range` is part of the query key, so flipping 30d → 7d → 30d serves the
 * second 30d from cache instead of refetching.
 */
export function useStatsSummary(range: StatsRange) {
  return useQuery({
    queryKey: ["admin-stats-summary", range],
    queryFn: () => fetchStatsSummary(range),
  });
}

export function useStatsTimeseries(range: StatsRange) {
  return useQuery({
    queryKey: ["admin-stats-timeseries", range],
    queryFn: () => fetchStatsTimeseries(range),
  });
}

/**
 * Deliberately has no `range` in its key — this data does not vary with the
 * selected window, so changing the range must not refetch it.
 */
export function useContentHealth() {
  return useQuery({
    queryKey: ["admin-stats-content-health"],
    queryFn: fetchContentHealth,
  });
}
