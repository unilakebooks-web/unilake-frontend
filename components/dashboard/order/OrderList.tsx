"use client";

import Link from "next/link";
import { PackageOpen } from "lucide-react";
import type { UserOrderRow } from "@/app/types/order";
import { OrderCard } from "./OrderCard";

export function OrderList({ orders }: { orders: UserOrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center text-center p-12 bg-white/70 backdrop-blur-sm rounded-[24px] border border-[#914A8C]/20 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#F8E7D2] flex items-center justify-center mb-4">
          <PackageOpen className="w-8 h-8 text-[#914A8C]" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
        <p className="text-gray-500 mb-6 max-w-sm">
          Once you create a personalised book, you&apos;ll be able to follow it here from
          printing all the way to your doorstep.
        </p>
        <Link
          href="/comic"
          className="px-6 py-3 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold rounded-xl transition-colors shadow-sm"
        >
          Browse stories
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
