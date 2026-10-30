import api from "@/app/lib/axios";
import type {
  AdminOrderDetail,
  AdminOrdersFilters,
  AdminOrdersResponse,
  ConfirmDimensionsInput,
  ConfirmDimensionsResponse,
  LabelResponse,
  RefreshTrackingResponse,
  RetryShiprocketResponse,
  UserOrderDetail,
  UserOrderRow,
  UserOrderTracking,
} from "@/app/types/order";

// ============================================================
// CUSTOMER (/api/user/orders)
// ============================================================

export async function fetchUserOrders(): Promise<UserOrderRow[]> {
  const { data } = await api.get<UserOrderRow[]>("/api/user/orders");
  return data;
}

export async function fetchUserOrder(orderId: string): Promise<UserOrderDetail> {
  const { data } = await api.get<UserOrderDetail>(`/api/user/orders/${orderId}`);
  return data;
}

export async function fetchOrderTracking(orderId: string): Promise<UserOrderTracking> {
  const { data } = await api.get<UserOrderTracking>(`/api/user/orders/${orderId}/tracking`);
  return data;
}

// ============================================================
// ADMIN (/api/admin/orders)
// ============================================================

export async function fetchAdminOrders(
  filters?: AdminOrdersFilters
): Promise<AdminOrdersResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

  const query = params.toString();
  const { data } = await api.get<AdminOrdersResponse>(
    `/api/admin/orders${query ? `?${query}` : ""}`
  );
  return data;
}

export async function fetchAdminOrder(orderId: string): Promise<AdminOrderDetail> {
  const { data } = await api.get<AdminOrderDetail>(`/api/admin/orders/${orderId}`);
  return data;
}

export async function confirmDimensions(
  orderId: string,
  dimensions: ConfirmDimensionsInput
): Promise<ConfirmDimensionsResponse> {
  const { data } = await api.post<ConfirmDimensionsResponse>(
    `/api/admin/orders/${orderId}/confirm-dimensions`,
    dimensions
  );
  return data;
}

export async function retryShiprocket(orderId: string): Promise<RetryShiprocketResponse> {
  const { data } = await api.post<RetryShiprocketResponse>(
    `/api/admin/orders/${orderId}/retry-shiprocket`
  );
  return data;
}

// Shiprocket mints a fresh label URL per call and we deliberately never cache it,
// so this is fired on demand rather than fetched alongside the order.
export async function fetchOrderLabel(orderId: string): Promise<LabelResponse> {
  const { data } = await api.get<LabelResponse>(`/api/admin/orders/${orderId}/label`);
  return data;
}

/**
 * Downloads an order's Bill of Supply PDF. The backend builds it on every
 * request and stores nothing, so this always reflects the order as it is.
 *
 * Raw file, not the JSON envelope — fetched as a Blob and handed to the
 * browser as a download, same as downloadCustomersCsv. The file name is set
 * here because Content-Disposition is not readable cross-origin.
 */
export async function downloadBillOfSupply(
  orderId: string,
  billNumber: string
): Promise<void> {
  const { data } = await api.get<Blob>(
    `/api/admin/orders/${orderId}/bill-of-supply`,
    { responseType: "blob" }
  );

  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${billNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function refreshTracking(orderId: string): Promise<RefreshTrackingResponse> {
  const { data } = await api.post<RefreshTrackingResponse>(
    `/api/admin/orders/${orderId}/refresh-tracking`
  );
  return data;
}
