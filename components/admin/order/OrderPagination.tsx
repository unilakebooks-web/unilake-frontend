import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AdminOrdersPagination } from "@/app/types/order";

/**
 * Server-paginated: totals come straight off the API response rather than being
 * derived from a client-side array length.
 *
 * Also used by the admin Users list, which has the same pagination shape —
 * `itemLabel` names what is being counted ("… of 45 users").
 */
export function OrderPagination({
  pagination,
  onPageChange,
  itemLabel = "orders",
}: {
  pagination: AdminOrdersPagination;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  const { page, pageSize, total, totalPages } = pagination;

  if (totalPages <= 1) return null;

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between py-4 px-2">
      <div className="text-sm text-neutral-500 font-medium">
        Showing <span className="font-semibold text-neutral-900">{startIndex}</span> to{" "}
        <span className="font-semibold text-neutral-900">{endIndex}</span> of{" "}
        <span className="font-semibold text-neutral-900">{total}</span> {itemLabel}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border-neutral-200 h-9 px-3"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border-neutral-200 h-9 px-3"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
