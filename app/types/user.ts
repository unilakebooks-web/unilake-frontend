import type { UserRole } from "./auth";

// Admin user management — GET /api/admin/users, PATCH /api/admin/users/:userId/role.

/** One row of the admin user list. Basic details only, by decision. */
export interface AdminUserRow {
  /** Better Auth's own random id — not a uuid. */
  id: string;
  name: string;
  /**
   * Facebook accounts without an email carry a synthetic
   * `${facebookId}@facebook.local` address — shown as-is.
   */
  email: string;
  /** Google/Facebook avatar URL. Facebook ones expire, so render with a fallback. */
  image: string | null;
  role: UserRole;
  createdAt: string;
}

/** Always newest-joined first server-side — there is no sort to pass. */
export interface AdminUsersFilters {
  page?: number;
  pageSize?: number;
  /** Matched case-insensitively against name and email. */
  search?: string;
  role?: UserRole;
}

export interface AdminUsersPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminUsersResponse {
  users: AdminUserRow[];
  pagination: AdminUsersPagination;
  /** Total admins across ALL users — unaffected by search/filter. */
  adminCount: number;
}
