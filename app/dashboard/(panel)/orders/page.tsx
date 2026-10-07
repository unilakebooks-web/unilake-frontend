"use client";

import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserOrders } from "@/hooks/useOrders";
import { OrderPageHeader } from "@/components/dashboard/order/OrderPageHeader";
import { OrderList } from "@/components/dashboard/order/OrderList";

export default function OrdersPage() {
  const { data: orders, isLoading, error, refetch } = useUserOrders();

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 font-poppins">
      <OrderPageHeader count={orders?.length} />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15 space-y-4"
            >
              <div className="flex gap-4">
                <Skeleton className="w-16 aspect-3/4 rounded-lg bg-[#F8E7D2]/80" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40 bg-[#F8E7D2]/80" />
                  <Skeleton className="h-4 w-28 bg-[#F8E7D2]/60" />
                  <Skeleton className="h-4 w-24 bg-[#F8E7D2]/60" />
                </div>
              </div>
              <Skeleton className="h-8 w-32 rounded-lg bg-[#F8E7D2]/80" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load your orders</h3>
          <p className="text-sm text-red-600 mb-5">
            {(error as { message?: string })?.message || "Network error"}
          </p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <OrderList orders={orders || []} />
      )}
    </div>
  );
}
