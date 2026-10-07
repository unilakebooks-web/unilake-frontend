"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminOrder } from "@/hooks/useOrders";
import { OrderDetailHeader } from "@/components/admin/order/OrderDetailHeader";
import { OrderInfoCards } from "@/components/admin/order/OrderInfoCards";
import { ShipmentSection } from "@/components/admin/order/ShipmentSection";
import { WebhookEventsLog } from "@/components/admin/order/WebhookEventsLog";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const router = useRouter();
  const { orderId } = use(params);

  const { data: order, isLoading, error, refetch } = useAdminOrder(orderId);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#914A8C]">
          <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
          <p className="font-bold">Loading order…</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    const is404 = (error as { code?: string })?.code === "NOT_FOUND";

    return (
      <div className="max-w-3xl mx-auto py-12">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/orders")}
          className="mb-8 text-neutral-600 hover:text-neutral-900 -ml-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>

        <div className="bg-red-50 border border-red-200 rounded-3xl p-12 text-center text-red-800 flex flex-col items-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="font-bold text-2xl mb-2">
            {is404 ? "Order not found" : "Failed to load order"}
          </h3>
          <p className="text-red-600 mb-6 max-w-md">
            {is404
              ? "This order doesn't exist, or the ID is wrong."
              : (error as { message?: string })?.message || "A network error occurred."}
          </p>
          {!is404 && (
            <Button
              onClick={() => refetch()}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm px-8"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-2 space-y-6">
      <OrderDetailHeader order={order} />
      <ShipmentSection order={order} />
      <OrderInfoCards order={order} />
      <WebhookEventsLog events={order.webhookEvents} />
    </div>
  );
}
