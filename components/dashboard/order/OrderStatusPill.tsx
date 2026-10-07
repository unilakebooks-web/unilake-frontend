import type { PublicOrderStatus, PublicOrderStatusCode } from "@/app/types/order";
import { cn } from "@/lib/utils";

/**
 * Customer-facing only. Deliberately NOT the admin OrderStatusBadge, which
 * renders the 9 raw OrderStatus values — including SHIPROCKET_FAILED, the
 * internal vocabulary the backend collapses away before it reaches a customer.
 *
 * The label always comes from the server so the wording stays in one place.
 */
const PILL_STYLES: Record<PublicOrderStatusCode, string> = {
  AWAITING_PAYMENT: "bg-amber-100 text-amber-900 border-amber-300",
  PREPARING: "bg-violet-100 text-violet-800 border-violet-200",
  // Orange sits deliberately next to AWAITING_PAYMENT's amber: both mean the
  // customer has to do something, and neither is a state we are working on.
  AWAITING_SELECTION: "bg-orange-100 text-orange-900 border-orange-300",
  PROCESSING: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SHIPPED: "bg-blue-100 text-blue-800 border-blue-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

export function OrderStatusPill({
  status,
  className,
}: {
  status: PublicOrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap",
        PILL_STYLES[status.code] ?? PILL_STYLES.PREPARING,
        className
      )}
    >
      {status.label}
    </span>
  );
}
