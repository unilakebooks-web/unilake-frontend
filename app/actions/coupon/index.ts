import api from "@/app/lib/axios";
import type {
  Coupon,
  CouponInput,
  CouponListFilters,
  CouponListResponse,
  GenerateCouponsInput,
} from "@/app/types/coupon";

export async function fetchCoupons(filters?: CouponListFilters): Promise<CouponListResponse> {
  const params = new URLSearchParams();
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
  if (filters?.status) params.append("status", filters.status);
  if (filters?.kind) params.append("kind", filters.kind);
  if (filters?.search) params.append("search", filters.search);

  const query = params.toString();
  const { data } = await api.get<CouponListResponse>(
    `/api/admin/coupons${query ? `?${query}` : ""}`
  );
  return data;
}

export async function createCoupon(payload: CouponInput): Promise<Coupon> {
  const { data } = await api.post<Coupon>("/api/admin/coupons", payload);
  return data;
}

export async function updateCoupon(id: string, payload: Partial<CouponInput>): Promise<Coupon> {
  const { data } = await api.patch<Coupon>(`/api/admin/coupons/${id}`, payload);
  return data;
}

export async function toggleCouponStatus(id: string): Promise<Coupon> {
  const { data } = await api.patch<Coupon>(`/api/admin/coupons/${id}/status`);
  return data;
}

export async function deleteCoupon(id: string): Promise<void> {
  await api.delete(`/api/admin/coupons/${id}`);
}

export async function generateCoupons(payload: GenerateCouponsInput): Promise<Coupon[]> {
  const { data } = await api.post<Coupon[]>("/api/admin/coupons/generate", payload);
  return data;
}
