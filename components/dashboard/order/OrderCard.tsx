"use client";

import Link from "next/link";
import { format } from "date-fns";
import { BookOpen, ChevronRight, CreditCard, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PublicOrderStatusCode, UserOrderRow } from "@/app/types/order";
import { OrderStatusPill } from "./OrderStatusPill";
import { OrderCoverImage } from "./OrderCoverImage";

/**
 * What the card offers for each stage. Every action goes to the preview page,
 * which renders the right thing for the session's state on its own: resume
 * payment, live generation progress, variant selection, or the printed book.
 *
 * Cancelled has no entry — there is no book to go back to.
 */
const PREVIEW_ACTIONS: Partial<
  Record<
    PublicOrderStatusCode,
    { label: string; icon: LucideIcon; message?: string; messageClass?: string }
  >
> = {
  // Sent to the preview rather than straight to checkout, so the customer sees
  // what they are paying for before being asked to pay.
  AWAITING_PAYMENT: {
    label: "Complete payment",
    icon: CreditCard,
    message: "This order isn't paid for yet. Finish checkout to get it printed.",
    messageClass: "text-amber-800",
  },
  PREPARING: {
    label: "View progress",
    icon: Sparkles,
    message: "We're creating the rest of your pages.",
    messageClass: "text-[#914A8C]",
  },
  // Paid and fully generated, but the customer never sent it to print. Nothing
  // is happening on our side, so the card has to say so and hand them the way
  // back in — otherwise the order just sits there looking finished.
  AWAITING_SELECTION: {
    label: "Finish your book",
    icon: BookOpen,
    message: "Your pages are ready — finish your book to get it printed.",
    messageClass: "text-orange-800",
  },
  PROCESSING: { label: "View your book", icon: BookOpen },
  SHIPPED: { label: "View your book", icon: BookOpen },
  DELIVERED: { label: "View your book", icon: BookOpen },
};

export function OrderCard({ order }: { order: UserOrderRow }) {
  const awaitingPayment = order.publicStatus.code === "AWAITING_PAYMENT";
  const awaitingSelection = order.publicStatus.code === "AWAITING_SELECTION";
  const action = PREVIEW_ACTIONS[order.publicStatus.code];
  return (
    <div
      className={`flex flex-col p-5 bg-white rounded-2xl border-2 shadow-sm transition-all ${
        awaitingPayment
          ? "border-amber-300"
          : awaitingSelection
            ? "border-orange-300"
            : "border-[#914A8C]/20 hover:border-[#914A8C]/40"
      }`}
    >
      <div className="flex gap-4">
        {/* 85px long edge = the old 64×85 portrait box's height. */}
        <OrderCoverImage
          generatedCover={order.generatedCover}
          comic={order.comic}
          longEdgePx={85}
        />

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-gray-900 leading-tight">{order.comic.title}</h3>
            <OrderStatusPill status={order.publicStatus} />
          </div>

          <div className="text-sm text-gray-500">
            Ordered {format(new Date(order.createdAt), "d MMM yyyy")}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="font-bold text-gray-900">
              {order.currency} {order.amount}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500 capitalize">
              {order.coverType.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
        {action?.message && (
          <p className={`text-sm font-medium ${action.messageClass ?? "text-gray-600"}`}>
            {action.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {action && (
            <Link
              href={`/personalize/${order.sessionId}/preview`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
            >
              <action.icon size={16} />
              {action.label}
            </Link>
          )}

          <Link
            href={`/dashboard/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#914A8C] hover:text-[#7a3e75] transition-colors"
          >
            View details
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
