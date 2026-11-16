import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  searchCouponCustomers,
} from "@/app/actions/coupon";
import type { CouponInput, CouponListFilters } from "@/app/types/coupon";

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
    mutationFn: toggleCouponStatus,
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
