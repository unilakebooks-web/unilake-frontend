import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  generateCoupons,
} from "@/app/actions/coupon";
import type { CouponInput, CouponListFilters } from "@/app/types/coupon";

export function useCoupons(filters?: CouponListFilters) {
  return useQuery({
    queryKey: ["coupons", filters],
    queryFn: () => fetchCoupons(filters),
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

export function useGenerateCoupons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateCoupons,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });
}
