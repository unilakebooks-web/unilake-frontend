import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminOrders,
  fetchAdminOrder,
  confirmDimensions,
  retryShiprocket,
  fetchOrderLabel,
  refreshTracking,
  fetchUserOrders,
  fetchUserOrder,
  fetchOrderTracking,
} from "@/app/actions/order";
import type { AdminOrdersFilters, ConfirmDimensionsInput } from "@/app/types/order";

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
