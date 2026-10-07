import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminUsers, updateUserRole } from "@/app/actions/user";
import type { UserRole } from "@/app/types/auth";
import type { AdminUsersFilters } from "@/app/types/user";

export function useAdminUsers(filters?: AdminUsersFilters) {
  return useQuery({
    queryKey: ["admin-users", filters],
    queryFn: () => fetchAdminUsers(filters),
  });
}

/**
 * A role change can move a row in or out of the current role filter and always
 * changes `adminCount`, so every cached page of the list is invalidated.
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
