import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { fetchCouponOffers } from "@/app/actions/session";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  searchCouponCustomers,
} from "@/app/actions/coupon";
import type { CouponInput, CouponListFilters, CouponOffer } from "@/app/types/coupon";

export function useCoupons(filters?: CouponListFilters) {
  return useQuery({
    queryKey: ["coupons", filters],
    queryFn: () => fetchCoupons(filters),
    // Keep showing the last list while a search or page change loads, instead of flashing skeletons.
    placeholderData: keepPreviousData,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CouponInput> }) =>
      updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useToggleCouponStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCouponStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}

export function useCouponCustomerSearch(search: string) {
  const text = search.trim();
  return useQuery({
    queryKey: ["coupon-customers", text],
    queryFn: () => searchCouponCustomers(text),
    enabled: text.length >= 2,
  });
}

const NO_OFFERS: CouponOffer[] = [];

/**
 * Coupons that fit this checkout. `keyParts` (country, cover) are in the query key so the
 * list is fetched again when they change. Errors are silent: the typed-code box always works.
 */
export function useCouponOffers(
  sessionId: string,
  enabled: boolean,
  keyParts: (string | null)[]
) {
  const query = useQuery({
    queryKey: ["coupon-offers", sessionId, ...keyParts],
    queryFn: async () => {
      try {
        return await fetchCouponOffers(sessionId);
      } catch {
        return NO_OFFERS;
      }
    },
    enabled,
  });
  return { offers: enabled ? (query.data ?? NO_OFFERS) : NO_OFFERS, refresh: query.refetch };
}
