import { TriangleAlert } from "lucide-react";
import type { AdminOrderDetail } from "@/app/types/order";

/**
 * Shown when a payment arrived for an order that is still unpaid here, or when a paid order
 * received a second payment. Both can happen when the customer changed their coupon (a new
 * Razorpay order was made for the new amount) and paid on the earlier one as well. The
 * payment is real, so someone must follow it up.
 */
export function SupersededPaymentNotice({ order }: { order: AdminOrderDetail }) {
  const captured = order.webhookEvents.filter((event) => event.eventType === "payment.captured").length;
  // Unpaid here with a payment received, or paid here and a second payment received as well.
  const paidElsewhere = (order.status === "CREATED" && captured >= 1) || captured >= 2;
  if (!paidElsewhere) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900"
    >
      <TriangleAlert className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
      <div className="text-sm leading-relaxed">
        <p className="font-bold">
          {order.status === "CREATED"
            ? "A payment was received for this order, but it is still unpaid here."
            : "More than one payment was received for this order."}
        </p>
        <p className="mt-1">
          {order.status === "CREATED"
            ? "The customer changed their coupon, so the order moved to a new payment of a different amount, and they paid on the earlier one. "
            : "This can happen when the customer changed their coupon and then paid on both the earlier and the new payment. "}
          Check the payments in Razorpay, then refund the extra one or contact the customer. The
          payment details are in the event log below.
        </p>
      </div>
    </div>
  );
}
