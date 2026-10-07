"use client";

import { useCallback, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/app/hooks/useAuth";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import type { AdminUserRow, AdminUsersFilters } from "@/app/types/user";
import { UserListPageHeader } from "@/components/admin/user/UserListPageHeader";
import { UserListFilters } from "@/components/admin/user/UserListFilters";
import { UserListTable } from "@/components/admin/user/UserListTable";
import { RoleChangeDialog } from "@/components/admin/user/RoleChangeDialog";
import { OrderPagination } from "@/components/admin/order/OrderPagination";

const PAGE_SIZE = 20;

function UserListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full bg-[#F8E7D2]/80" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 bg-[#F8E7D2]/80" />
              <Skeleton className="h-4 w-36 bg-[#F8E7D2]/60" />
            </div>
          </div>
          <Skeleton className="h-8 w-28 rounded-lg bg-[#F8E7D2]/80" />
        </div>
      ))}
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Omit<AdminUsersFilters, "page" | "pageSize">>({});
  const [roleChangeTarget, setRoleChangeTarget] = useState<AdminUserRow | null>(null);

  const { data, isLoading, error, refetch } = useAdminUsers({
    ...filters,
    page,
    pageSize: PAGE_SIZE,
  });

  // Stable — UserListFilters lists it in a debounce effect's dependencies.
  const handleFiltersChange = useCallback(
    (next: Omit<AdminUsersFilters, "page" | "pageSize">) => {
      setFilters(next);
      setPage(1); // A narrower result set makes the old page number meaningless.
    },
    []
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <UserListPageHeader total={data?.pagination.total} adminCount={data?.adminCount} />

      <UserListFilters onFiltersChange={handleFiltersChange} />

      {isLoading ? (
        <UserListSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load users</h3>
          <p className="text-sm text-red-600 mb-5">
            {(error as { message?: string })?.message || "Network error"}
          </p>
          <Button
            onClick={() => refetch()}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Try Again
          </Button>
        </div>
      ) : data ? (
        <>
          <UserListTable
            users={data.users}
            currentUserId={currentUser?.id}
            onChangeRole={setRoleChangeTarget}
          />
          <OrderPagination
            pagination={data.pagination}
            onPageChange={setPage}
            itemLabel="users"
          />
        </>
      ) : null}

      <RoleChangeDialog
        user={roleChangeTarget}
        onOpenChange={(open) => {
          if (!open) setRoleChangeTarget(null);
        }}
      />
    </div>
  );
}
