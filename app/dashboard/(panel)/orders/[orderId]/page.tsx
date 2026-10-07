"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, CreditCard, Loader2, XCircle } from "lucide-react";
import { useOrderTracking, useUserOrder } from "@/hooks/useOrders";
import { OrderDetailCards } from "@/components/dashboard/order/OrderDetailCards";
import { OrderTrackingTimeline } from "@/components/dashboard/order/OrderTrackingTimeline";

function BackLink() {
  return (
    <Link
      href="/dashboard/orders"
      className="inline-flex items-center gap-2 text-sm font-bold text-[#914A8C] hover:text-[#7a3e75] transition-colors"
    >
      <ArrowLeft size={16} />
      Back to my orders
    </Link>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const router = useRouter();
  const { orderId } = use(params);

  const { data: order, isLoading, error, refetch } = useUserOrder(orderId);

  // No parcel to track for an unpaid, cancelled, or not-yet-sent-to-print
  // order, so don't ask. AWAITING_SELECTION is the newest of these: the book is
  // generated but the customer has not committed it, so nothing has been
  // printed and no shipment exists to report on.
  const statusCode = order?.publicStatus.code;
  const trackable =
    !!statusCode &&
    statusCode !== "AWAITING_PAYMENT" &&
    statusCode !== "AWAITING_SELECTION" &&
    statusCode !== "CANCELLED";

  const { data: tracking, isLoading: trackingLoading } = useOrderTracking(orderId, trackable);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#914A8C]">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="font-bold">Loading your order…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    const code = (error as { code?: string })?.code;
    // A 403 is a genuinely different situation from a bad id and shouldn't read
    // like one — this order exists, it just isn't theirs.
    const isForbidden = code === "FORBIDDEN";
    const isNotFound = code === "NOT_FOUND";

    return (
      <div className="max-w-2xl mx-auto py-8 font-poppins space-y-8">
        <BackLink />
        <div className="bg-white rounded-[24px] border-2 border-[#914A8C]/20 p-12 text-center flex flex-col items-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-[#914A8C]/40 mb-4" />
          <h3 className="font-bold text-xl text-gray-900 mb-2">
            {isForbidden
              ? "This order isn't on your account"
              : isNotFound
                ? "We couldn't find that order"
                : "Something went wrong"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm">
            {isForbidden
              ? "It looks like this order belongs to a different account. Try signing in with the email you used to place it."
              : isNotFound
                ? "This order doesn't exist, or the link is incorrect."
                : (error as { message?: string })?.message ||
                  "We couldn't load this order just now."}
          </p>
          {!isForbidden && !isNotFound && (
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-2 font-poppins space-y-6">
      <BackLink />

      {statusCode === "AWAITING_PAYMENT" ? (
        <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-300">
          <h2 className="font-bold text-gray-900 mb-1">This order isn&apos;t paid for yet</h2>
          <p className="text-sm text-amber-900 mb-4">
            Finish checkout and we&apos;ll start printing your book right away.
          </p>
          {/* To the preview, not straight to checkout: the customer sees the
              book they are paying for, and resumes payment from there. */}
          <button
            onClick={() => router.push(`/personalize/${order.sessionId}/preview`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <CreditCard size={16} />
            Complete payment
          </button>
        </div>
      ) : statusCode === "AWAITING_SELECTION" ? (
        // Deliberately renders nothing. The timeline is wrong here — there is
        // no parcel yet — and the call to action lives in the "Your book" card below,
        // so a banner at the top would just duplicate it.
        null
      ) : statusCode === "CANCELLED" ? (
        <div className="p-6 bg-white rounded-2xl border-2 border-[#914A8C]/20 shadow-sm flex items-start gap-3">
          <XCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-gray-900 mb-1">This order was cancelled</h2>
            <p className="text-sm text-gray-500">
              Get in touch if you think this is a mistake and we&apos;ll look into it.
            </p>
          </div>
        </div>
      ) : (
        <OrderTrackingTimeline
          tracking={tracking}
          orderCreatedAt={order.createdAt}
          isLoading={trackingLoading}
        />
      )}

      <OrderDetailCards order={order} />
    </div>
  );
}
