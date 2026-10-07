import api from "@/app/lib/axios";
import type { UserRole } from "@/app/types/auth";
import type {
  AdminUserRow,
  AdminUsersFilters,
  AdminUsersResponse,
} from "@/app/types/user";

// ============================================================
// ADMIN (/api/admin/users)
// ============================================================

export async function fetchAdminUsers(
  filters?: AdminUsersFilters
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.pageSize) params.append("pageSize", String(filters.pageSize));
  if (filters?.search) params.append("search", filters.search);
  if (filters?.role) params.append("role", filters.role);

  const query = params.toString();
  const { data } = await api.get<AdminUsersResponse>(
    `/api/admin/users${query ? `?${query}` : ""}`
  );
  return data;
}

/**
 * Rejects with the backend's message on a refused change — e.g. 409 "You can't
 * remove your own admin access." or "There must be at least one admin."
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<AdminUserRow> {
  const { data } = await api.patch<AdminUserRow>(
    `/api/admin/users/${encodeURIComponent(userId)}/role`,
    { role }
  );
  return data;
}
