"use client";

import Link from "next/link";
import { format } from "date-fns";
import { BookOpen, MapPin, Sparkles } from "lucide-react";
import type { UserOrderDetail } from "@/app/types/order";
import { OrderStatusPill } from "./OrderStatusPill";
import { OrderCoverImage } from "./OrderCoverImage";

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 bg-white rounded-2xl border-2 border-[#914A8C]/20 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-[#914A8C]">
        {icon}
        <h2 className="font-bold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function OrderDetailCards({ order }: { order: UserOrderDetail }) {
  const { shipping, comic } = order;

  const addressLines = [
    shipping.line1,
    shipping.line2,
    [shipping.city, shipping.state].filter(Boolean).join(", "),
    [shipping.zip, shipping.country].filter(Boolean).join(" "),
  ].filter(Boolean);

  const statusCode = order.publicStatus.code;

  // The "Your book" card — the customer's way back to their pages. Every link
  // goes to the preview page, which renders the right mode for the session on
  // its own:
  //   - AWAITING_SELECTION: still selectable, with the send-to-print section —
  //     nothing is printed until they commit it, so it must stay reachable;
  //   - PREPARING: live generation progress;
  //   - PROCESSING / SHIPPED / DELIVERED: already sent to print, so the preview
  //     is read-only — the printed variants only, no send-to-print.
  //
  // This card replaced the PDF download. The PDF is a print file for us, not a
  // customer deliverable; the read-only preview is how they see their book.
  //
  // No card for:
  //   - AWAITING_PAYMENT: the banner above these cards already links there;
  //   - CANCELLED: there is no book to return to.
  const bookCard =
    statusCode === "AWAITING_SELECTION"
      ? {
          message:
            "Almost there — your pages are ready and waiting for you to send them to print.",
          label: "Finish your book",
          icon: BookOpen,
        }
      : statusCode === "PREPARING"
        ? {
            message:
              "We're creating the rest of your pages — you can watch them appear as they're made.",
            label: "View progress",
            icon: Sparkles,
          }
        : statusCode === "PROCESSING" || statusCode === "SHIPPED" || statusCode === "DELIVERED"
          ? {
              message: "See every page of your book, exactly as we're printing it.",
              label: "View your book",
              icon: BookOpen,
            }
          : null;

  return (
    <div className="space-y-6">
      <Card title="Your order" icon={<BookOpen className="w-4 h-4" />}>
        <div className="flex gap-5">
          {/* 107px long edge = the old 80px-wide 3:4 box's height. */}
          <OrderCoverImage
            generatedCover={order.generatedCover}
            comic={comic}
            longEdgePx={107}
          />
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold text-gray-900 text-lg leading-tight">{comic.title}</h3>
              <OrderStatusPill status={order.publicStatus} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Total paid</dt>
                <dd className="font-bold text-gray-900">
                  {order.currency} {order.amount}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Cover</dt>
                <dd className="font-semibold text-gray-900 capitalize">
                  {order.coverType.toLowerCase()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Ordered on</dt>
                <dd className="font-semibold text-gray-900">
                  {format(new Date(order.createdAt), "d MMM yyyy")}
                </dd>
              </div>
              {order.courierName && (
                <div>
                  <dt className="text-gray-500">Courier</dt>
                  <dd className="font-semibold text-gray-900">{order.courierName}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </Card>

      <Card title="Delivery address" icon={<MapPin className="w-4 h-4" />}>
        {shipping.name || addressLines.length ? (
          <div className="text-sm text-gray-600 space-y-1">
            {shipping.name && (
              <p className="font-bold text-gray-900 text-base">{shipping.name}</p>
            )}
            {addressLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            {shipping.phone && <p className="pt-1 text-gray-500">{shipping.phone}</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No delivery address on this order.</p>
        )}
      </Card>

      {bookCard && (
        <Card title="Your book" icon={<BookOpen className="w-4 h-4" />}>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{bookCard.message}</p>
            <Link
              href={`/personalize/${order.sessionId}/preview`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
            >
              <bookCard.icon size={16} />
              {bookCard.label}
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
