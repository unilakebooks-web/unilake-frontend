import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminOrders,
  fetchAdminOrder,
  fetchAdminOrderPages,
  regenerateOrderPages,
  confirmDimensions,
  retryShiprocket,
  fetchOrderLabel,
  refreshTracking,
  setSentToPrinter,
  editOrderAddress,
  retryAddressSync,
  markAddressSynced,
  fetchUserOrders,
  fetchUserOrder,
  fetchOrderTracking,
} from "@/app/actions/order";
import type {
  AdminOrderPages,
  AdminOrdersFilters,
  ConfirmDimensionsInput,
  EditOrderAddressInput,
  MarkAddressSyncedInput,
  RegenerateOrderPagesInput,
} from "@/app/types/order";

// Customer-facing. Query keys are namespaced away from the admin ones below so
// the two caches can never collide on the same order id.

export function useUserOrders() {
  return useQuery({
    queryKey: ["user-orders"],
    queryFn: fetchUserOrders,
  });
}

export function useUserOrder(orderId: string) {
  return useQuery({
    queryKey: ["user-order", orderId],
    queryFn: () => fetchUserOrder(orderId),
    enabled: !!orderId,
  });
}

/**
 * `enabled` lets the caller skip the request for orders with no shipment to
 * track — awaiting payment or cancelled.
 */
export function useOrderTracking(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["order-tracking", orderId],
    queryFn: () => fetchOrderTracking(orderId),
    enabled: !!orderId && enabled,
  });
}

export function useAdminOrders(filters?: AdminOrdersFilters) {
  return useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: () => fetchAdminOrders(filters),
  });
}

export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: () => fetchAdminOrder(orderId),
    enabled: !!orderId,
  });
}

// Every mutation below can move Order.status, which the list renders as a column —
// so each invalidates the list as well as the detail it was fired from.
function useOrderActionInvalidation(orderId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };
}

export function useConfirmDimensions(orderId: string) {
  const invalidate = useOrderActionInvalidation(orderId);
  return useMutation({
    mutationFn: (dimensions: ConfirmDimensionsInput) => confirmDimensions(orderId, dimensions),
    onSuccess: invalidate,
  });
}

export function useRetryShiprocket(orderId: string) {
  const invalidate = useOrderActionInvalidation(orderId);
  return useMutation({
    mutationFn: () => retryShiprocket(orderId),
    onSuccess: invalidate,
  });
}

export function useSetSentToPrinter(orderId: string) {
  const invalidate = useOrderActionInvalidation(orderId);
  return useMutation({
    mutationFn: (sent: boolean) => setSentToPrinter(orderId, sent),
    onSuccess: invalidate,
  });
}

export function useRefreshTracking(orderId: string) {
  const invalidate = useOrderActionInvalidation(orderId);
  return useMutation({
    mutationFn: () => refreshTracking(orderId),
    onSuccess: invalidate,
  });
}

/**
 * A mutation rather than a query: the backend regenerates the label URL on every
 * call and never caches it, so it must fire on click, not on mount.
 */
export function useOrderLabel(orderId: string) {
  return useMutation({
    mutationFn: () => fetchOrderLabel(orderId),
  });
}

// ----- Pages of a paid order (restart stuck or failed pages) -----

/** The long poll stops after this long on one visit, so a forgotten tab does not hold the server awake for ever. */
const PAGES_WATCH_MS = 30 * 60 * 1000;
// Keep in step with MAX_WAIT_SECONDS in the backend's config/pageRecovery.ts (the longest the server holds a request).
const PAGES_WAIT_SECONDS = 25;
/** Pause before the next long poll starts, so a fast answer cannot loop the request. */
const PAGES_REPOLL_MS = 300;
/** After a failed refresh the list stays on screen and is tried again this slowly (never in a tight loop). */
const PAGES_ERROR_RETRY_MS = 10_000;

const hasPagesInProgress = (data: AdminOrderPages | undefined) =>
  !!data?.pages.some(
    (p) => p.state === "IN_PROGRESS" || p.state === "WAITING" || p.retryRunning
  );

/**
 * The pages of an order. While anything is in progress each answer is requested again at
 * once as a long poll (the server holds it up to 25 s and answers early when something
 * changes), so the screen follows progress and the request-billed server stays awake.
 * `retry: false`: a 404 (older backend) or an outage must just hide the section.
 */
export function useAdminOrderPages(orderId: string) {
  const signature = useRef<string | undefined>(undefined);
  // When this visit started watching; set on first use (not during render) and again by watchAgain.
  const watchStarted = useRef(0);
  const watching = () => {
    if (watchStarted.current === 0) watchStarted.current = Date.now();
    return Date.now() - watchStarted.current < PAGES_WATCH_MS;
  };
  const queryClient = useQueryClient();
  // Each start of watching is an epoch; the 30 minutes run per epoch, and the screen is told
  // when they are up (watchStopped) so it never claims to update by itself after that.
  const [epoch, setEpoch] = useState(0);
  const [stoppedEpoch, setStoppedEpoch] = useState(-1);
  useEffect(() => {
    const timer = setTimeout(() => setStoppedEpoch(epoch), PAGES_WATCH_MS);
    return () => clearTimeout(timer);
  }, [epoch]);
  const watchStopped = stoppedEpoch === epoch;

  const query = useQuery({
    queryKey: ["admin-order-pages", orderId],
    queryFn: async () => {
      const previous = queryClient.getQueryData<AdminOrderPages>(["admin-order-pages", orderId]);
      const data = await fetchAdminOrderPages(orderId, {
        wait: watching() && hasPagesInProgress(previous) ? PAGES_WAIT_SECONDS : 0,
        sig: signature.current,
      });
      signature.current = data.signature;
      return data;
    },
    enabled: !!orderId,
    retry: false,
    staleTime: 0,
    // After an error the last good data is kept; it is tried again slowly, and only if there
    // is something to show (a first load that fails, such as an older backend, is not retried).
    refetchInterval: (q) =>
      q.state.status === "error"
        ? q.state.data && watching()
          ? PAGES_ERROR_RETRY_MS
          : false
        : hasPagesInProgress(q.state.data) && watching()
          ? PAGES_REPOLL_MS
          : false,
    // The long poll is what keeps the request-billed server working on the pages, so it
    // carries on in a background tab (until the 30 minutes are up).
    refetchIntervalInBackground: true,
  });

  // Coming back to the tab starts a fresh 30 minutes of watching.
  useEffect(() => {
    const resume = () => {
      watchStarted.current = Date.now();
      signature.current = undefined;
      setEpoch((e) => e + 1);
    };
    window.addEventListener("focus", resume);
    return () => window.removeEventListener("focus", resume);
  }, []);

  /** Start watching again after a restart. */
  const watchAgain = () => {
    watchStarted.current = Date.now();
    signature.current = undefined;
    setEpoch((e) => e + 1);
  };

  return { ...query, watchAgain, watchStopped };
}

export function useRegenerateOrderPages(orderId: string, watchAgain: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegenerateOrderPagesInput) => regenerateOrderPages(orderId, input),
    onSuccess: () => {
      watchAgain();
      queryClient.invalidateQueries({ queryKey: ["admin-order-pages", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    // A refused or failed restart may still have changed things (a 503 after the rows were
    // reset): show what is true now instead of a list that still offers the same buttons.
    onError: () => {
      watchAgain();
      queryClient.invalidateQueries({ queryKey: ["admin-order-pages", orderId] });
    },
  });
}

// ----- Delivery address (admin edits it until the AWB exists) -----

export function useEditOrderAddress(orderId: string) {
  const invalidate = useOrderActionInvalidation(orderId);
  return useMutation({
    mutationFn: (input: EditOrderAddressInput) => editOrderAddress(orderId, input),
    onSuccess: invalidate,
    // A refusal (the address changed meanwhile, the AWB appeared) means the screen is stale.
    onError: invalidate,
  });
}

export function useRetryAddressSync(orderId: string) {
  const invalidate = useOrderActionInvalidation(orderId);
  return useMutation({
    mutationFn: () => retryAddressSync(orderId),
    onSuccess: invalidate,
    onError: invalidate,
  });
}

export function useMarkAddressSynced(orderId: string) {
  const invalidate = useOrderActionInvalidation(orderId);
  return useMutation({
    mutationFn: (input: MarkAddressSyncedInput) => markAddressSynced(orderId, input),
    onSuccess: invalidate,
    onError: invalidate,
  });
}
