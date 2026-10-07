import type { OrderStatus } from "@/app/types/order";
import { cn } from "@/lib/utils";

/**
 * READY_TO_SHIP and SHIPROCKET_FAILED are the two states that need an admin to do
 * something, so they get the loudest colours — everything else is progression.
 */
const STATUS_STYLES: Record<OrderStatus, { label: string; className: string }> = {
  CREATED: { label: "AWAITING PAYMENT", className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  PAID: { label: "PAID", className: "bg-sky-50 text-sky-700 border-sky-200" },
  GENERATED: { label: "GENERATED", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  CONFIRMED: { label: "CONFIRMED", className: "bg-violet-50 text-violet-700 border-violet-200" },
  SHIPROCKET_FAILED: { label: "SHIPROCKET FAILED", className: "bg-red-100 text-red-800 border-red-300" },
  READY_TO_SHIP: { label: "READY TO SHIP", className: "bg-amber-100 text-amber-900 border-amber-300" },
  SHIPPED: { label: "SHIPPED", className: "bg-blue-100 text-blue-800 border-blue-200" },
  DELIVERED: { label: "DELIVERED", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CANCELLED: { label: "CANCELLED", className: "bg-neutral-100 text-neutral-500 border-neutral-200 line-through" },
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border shadow-sm whitespace-nowrap",
        style.className,
        className
      )}
    >
      {style.label}
    </span>
  );
}
