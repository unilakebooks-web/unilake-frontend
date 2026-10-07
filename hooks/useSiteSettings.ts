import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSiteSetting, saveSiteSetting } from "@/app/actions/siteSetting";
import { fetchPublicSiteSetting } from "@/app/actions/public";

/** Admin read — drives the Settings form. */
export function useSiteSetting() {
  return useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: fetchSiteSetting,
  });
}

export function useSaveSiteSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveSiteSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      // The Footer and /contact read the public copy — keep them in step so an
      // admin sees their own edit reflected without a hard reload.
      queryClient.invalidateQueries({ queryKey: ["public-site-settings"] });
    },
  });
}

/**
 * Public read — used by the Footer, which mounts on essentially every page.
 *
 * The long staleTime is the point: these values change maybe monthly, and
 * without it TanStack would refetch on every client-side navigation just to
 * render a footer that has not changed.
 */
export function usePublicSiteSetting() {
  return useQuery({
    queryKey: ["public-site-settings"],
    queryFn: fetchPublicSiteSetting,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * True when the store is not accepting orders.
 *
 * Exists so the fail-open rule lives in exactly one place. Two callers need it
 * — the preview page's checkout button and the comic page's banner — and
 * getting `?? true` backwards in either one would hang a "closed" sign on an
 * open store.
 *
 * FAILS OPEN twice over: the settings row is null until an admin first saves,
 * and `fetchPublicSiteSetting` swallows network errors and returns null. Both
 * resolve to "open", matching the column's own `@default(true)`.
 *
 * This is a UI signal only. The backend rejects the checkout request on its own
 * and would do so even if every caller here returned false.
 */
export function useOrdersPaused(): boolean {
  const { data: setting } = usePublicSiteSetting();
  return setting ? !setting.acceptingOrders : false;
}
