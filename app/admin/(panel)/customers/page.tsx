"use client";

import { useCallback, useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminCustomers } from "@/hooks/useAdminCustomers";
import { downloadCustomersCsv } from "@/app/actions/customer";
import { getErrorMessage } from "@/lib/utils";
import { CustomerListPageHeader } from "@/components/admin/customer/CustomerListPageHeader";
import { CustomerListFilters } from "@/components/admin/customer/CustomerListFilters";
import { CustomerListTable } from "@/components/admin/customer/CustomerListTable";
import { OrderPagination } from "@/components/admin/order/OrderPagination";

const PAGE_SIZE = 20;

function CustomerListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
        >
          <div className="space-y-2">
            <Skeleton className="h-5 w-48 bg-[#F8E7D2]/80" />
            <Skeleton className="h-4 w-36 bg-[#F8E7D2]/60" />
          </div>
          <Skeleton className="h-5 w-24 bg-[#F8E7D2]/80" />
        </div>
      ))}
    </div>
  );
}

/**
 * Everyone who has paid for a book, with how to reach them. One row per
 * customer account; see customer.service.ts on the backend for exactly which
 * orders count and where the email and phone come from.
 */
export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error, refetch } = useAdminCustomers({
    page,
    pageSize: PAGE_SIZE,
    search,
  });

  // Stable — CustomerListFilters lists it in a debounce effect's dependencies.
  const handleSearchChange = useCallback((next: string | undefined) => {
    setSearch(next);
    setPage(1); // A narrower result set makes the old page number meaningless.
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadCustomersCsv(search);
      toast.success("Customer list downloaded");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't export the customer list. Please try again."));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <CustomerListPageHeader total={data?.pagination.total} />

      <CustomerListFilters
        onSearchChange={handleSearchChange}
        onExport={handleExport}
        isExporting={isExporting}
        exportDisabled={!data || data.pagination.total === 0}
      />

      {isLoading ? (
        <CustomerListSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load customers</h3>
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
          <CustomerListTable customers={data.customers} isSearching={!!search} />
          <OrderPagination
            pagination={data.pagination}
            onPageChange={setPage}
            itemLabel="customers"
          />
        </>
      ) : null}
    </div>
  );
}
