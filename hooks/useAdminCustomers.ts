import { useQuery } from "@tanstack/react-query";
import { fetchAdminCustomers } from "@/app/actions/customer";
import type { AdminCustomersFilters } from "@/app/types/customer";

export function useAdminCustomers(filters?: AdminCustomersFilters) {
  return useQuery({
    queryKey: ["admin-customers", filters],
    queryFn: () => fetchAdminCustomers(filters),
  });
}
