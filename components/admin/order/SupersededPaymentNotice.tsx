import { TriangleAlert } from "lucide-react";
import type { AdminOrderDetail } from "@/app/types/order";

/**
 * Shown when a payment arrived for an order that is still unpaid here. That happens when
 * the customer changed their coupon (a new Razorpay order was made for the new amount) and
 * then paid on the earlier one. The payment is real, so someone must follow it up.
 */
export function SupersededPaymentNotice({ order }: { order: AdminOrderDetail }) {
  const paidElsewhere =
    order.status === "CREATED" &&
    order.webhookEvents.some((event) => event.eventType === "payment.captured");
  if (!paidElsewhere) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900"
    >
      <TriangleAlert className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
      <div className="text-sm leading-relaxed">
        <p className="font-bold">A payment was received for this order, but it is still unpaid here.</p>
        <p className="mt-1">
          The customer changed their coupon, so the order moved to a new payment of a different
          amount, and they paid on the earlier one. Check the payment in Razorpay, then refund it
          or contact the customer. The payment details are in the event log below.
        </p>
      </div>
    </div>
  );
}
