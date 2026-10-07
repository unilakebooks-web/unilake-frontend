import api from "@/app/lib/axios";
import type {
  AdminCustomersFilters,
  AdminCustomersResponse,
} from "@/app/types/customer";

// ============================================================
// ADMIN (/api/admin/customers)
// ============================================================

export async function fetchAdminCustomers(
  filters?: AdminCustomersFilters
): Promise<AdminCustomersResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
  if (filters?.search) params.append("search", filters.search);

  const query = params.toString();
  const { data } = await api.get<AdminCustomersResponse>(
    `/api/admin/customers${query ? `?${query}` : ""}`
  );
  return data;
}

/**
 * Downloads the customer list as a CSV file — every customer matching
 * `search`, not just the visible page.
 *
 * The endpoint returns a raw file, not the JSON envelope, so it is fetched as
 * a Blob and handed to the browser as a download. The file name is set here
 * (the Content-Disposition header is not readable cross-origin without an
 * Access-Control-Expose-Headers entry).
 */
export async function downloadCustomersCsv(search?: string): Promise<void> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  const query = params.toString();

  const { data } = await api.get<Blob>(
    `/api/admin/customers/export${query ? `?${query}` : ""}`,
    { responseType: "blob" }
  );

  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `unilake-customers-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
