"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminOrderDetail } from "@/app/types/order";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderDetailHeader({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked by permissions; the id is visible either way.
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        onClick={() => router.push("/admin/orders")}
        className="text-neutral-600 hover:text-neutral-900 -ml-3"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Orders
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">
              {order.session.comic.title}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-neutral-500">{order.id}</span>
            <button
              onClick={copyId}
              aria-label="Copy order ID"
              className="text-neutral-400 hover:text-[#914A8C] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="text-right text-xs text-neutral-500 font-medium">
          <div>Created {format(new Date(order.createdAt), "MMM d, yyyy · h:mm a")}</div>
          <div>Updated {format(new Date(order.updatedAt), "MMM d, yyyy · h:mm a")}</div>
        </div>
      </div>
    </div>
  );
}
