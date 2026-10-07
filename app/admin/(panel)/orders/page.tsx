"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminOrders } from "@/hooks/useOrders";
import {
  ORDER_STATUSES,
  type AdminOrdersFilters,
  type OrderStatus,
} from "@/app/types/order";
import { OrderListPageHeader } from "@/components/admin/order/OrderListPageHeader";
import { OrderListFilters } from "@/components/admin/order/OrderListFilters";
import { OrderListTable } from "@/components/admin/order/OrderListTable";
import { OrderPagination } from "@/components/admin/order/OrderPagination";

const PAGE_SIZE = 20;

function OrderListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
        >
          <div className="space-y-2">
            <Skeleton className="h-5 w-56 bg-[#F8E7D2]/80" />
            <Skeleton className="h-4 w-36 bg-[#F8E7D2]/60" />
          </div>
          <Skeleton className="h-6 w-28 rounded-full bg-[#F8E7D2]/80" />
        </div>
      ))}
    </div>
  );
}

function OrdersPageContent() {
  const searchParams = useSearchParams();

  // Deep links from the overview's needs-attention cards arrive as
  // `?status=SHIPROCKET_FAILED`. Validated against the known set rather than
  // cast — the value comes off the URL, so a typo or a stale bookmark would
  // otherwise be sent to the API and come back a 400.
  const statusParam = searchParams.get("status");
  const initialStatus =
    statusParam && ORDER_STATUSES.includes(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined;

  const [page, setPage] = useState(1);

  // Seeded with the URL's status so the FIRST request is already filtered.
  // Without this the page would fetch everything, then refetch filtered 400ms
  // later when the filter bar's debounce fires — a visible flash of the wrong
  // list on every deep link.
  const [filters, setFilters] = useState<
    Omit<AdminOrdersFilters, "page" | "pageSize">
  >({
    status: initialStatus,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data, isLoading, error, refetch } = useAdminOrders({
    ...filters,
    page,
    pageSize: PAGE_SIZE,
  });

  // Stable — OrderListFilters lists it in a debounce effect's dependencies.
  const handleFiltersChange = useCallback(
    (next: Omit<AdminOrdersFilters, "page" | "pageSize">) => {
      setFilters(next);
      setPage(1); // A narrower result set makes the old page number meaningless.
    },
    []
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <OrderListPageHeader total={data?.pagination.total} />

      <OrderListFilters
        onFiltersChange={handleFiltersChange}
        initialStatus={initialStatus}
      />

      {isLoading ? (
        <OrderListSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load orders</h3>
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
          <OrderListTable orders={data.orders} />
          <OrderPagination pagination={data.pagination} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}

/**
 * `useSearchParams` opts a client component into deferred rendering, so Next
 * requires a Suspense boundary above it — without one the build fails on this
 * route rather than at runtime.
 */
export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-6xl mx-auto py-2">
          <OrderListPageHeader />
          <OrderListSkeleton />
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
