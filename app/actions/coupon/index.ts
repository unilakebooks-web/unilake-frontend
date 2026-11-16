import api from "@/app/lib/axios";
import type {
  Coupon,
  CouponCustomer,
  CouponInput,
  CouponListFilters,
  CouponListResponse,
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

/** Sends the state the admin chose, so a double click or a stale page cannot flip it the wrong way. */
export async function toggleCouponStatus(id: string, isActive: boolean): Promise<Coupon> {
  const { data } = await api.patch<Coupon>(`/api/admin/coupons/${id}/status`, { isActive });
  return data;
}

export async function deleteCoupon(id: string): Promise<void> {
  await api.delete(`/api/admin/coupons/${id}`);
}

/** Registered accounts matching a name or email, for a customer-only coupon. */
export async function searchCouponCustomers(search: string): Promise<CouponCustomer[]> {
  const { data } = await api.get<CouponCustomer[]>(
    `/api/admin/coupons/customers?search=${encodeURIComponent(search)}`
  );
  return data;
}
