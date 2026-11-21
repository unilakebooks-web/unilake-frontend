import { TriangleAlert } from "lucide-react";
import type { AdminOrderDetail } from "@/app/types/order";

/**
 * Shown when the order was paid after its photo and files were deleted (automatic data deletion): the
 * payment is real but no book can be made, so someone must follow it up.
 */
export function PaidAfterDeletionNotice({ order }: { order: AdminOrderDetail }) {
  if (!order.deletion?.paidAfterDeletion) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900"
    >
      <TriangleAlert className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
      <div className="text-sm leading-relaxed">
        <p className="font-bold">Paid after the photo and files were deleted</p>
        <p className="mt-1">
          No book can be made. Contact the customer for a new photo or a refund.
        </p>
      </div>
    </div>
  );
}
