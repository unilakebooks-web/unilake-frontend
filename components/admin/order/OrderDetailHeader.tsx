"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Check, Copy, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminOrderDetail } from "@/app/types/order";
import { downloadBillOfSupply } from "@/app/actions/order";
import { OrderStatusBadge } from "./OrderStatusBadge";

export function OrderDetailHeader({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isDownloadingBill, setIsDownloadingBill] = useState(false);

  const downloadBill = async () => {
    if (!order.bill) return;
    setIsDownloadingBill(true);
    try {
      await downloadBillOfSupply(order.id, order.bill.billNumber);
    } catch {
      toast.error("Couldn't download the Bill of Supply. Please try again.");
    } finally {
      setIsDownloadingBill(false);
    }
  };

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

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {/* Only orders with a bill number have a Bill of Supply — INR
                orders paid after billing was switched on. Built on demand by
                the backend; nothing is stored. */}
            {order.bill && (
              <button
                type="button"
                onClick={downloadBill}
                disabled={isDownloadingBill}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#914A8C] text-[#914A8C] hover:bg-[#914A8C]/10 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDownloadingBill ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Download Bill of Supply
              </button>
            )}
            {/* The customer's own preview page, in its read-only admin mode
                (`?view=admin` — see app/personalize/[sessionId]/preview). New tab
                so the admin keeps this order open. */}
            <a
              href={`/personalize/${order.session.id}/preview?view=admin`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold text-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              View customer&apos;s book
            </a>
          </div>
          {order.bill && (
            <div className="text-xs font-semibold text-neutral-600">
              Bill #{order.bill.billNumber}
            </div>
          )}
          <div className="text-right text-xs text-neutral-500 font-medium">
            <div>Created {format(new Date(order.createdAt), "MMM d, yyyy · h:mm a")}</div>
            <div>Updated {format(new Date(order.updatedAt), "MMM d, yyyy · h:mm a")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
