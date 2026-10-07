"use client";

import { format } from "date-fns";
import { Check, Loader2, Truck } from "lucide-react";
import type { PublicOrderStatusCode, UserOrderTracking } from "@/app/types/order";

// The four shipping stages a paid order moves through. AWAITING_PAYMENT and
// CANCELLED aren't points on this line — they're handled separately by the
// caller, since neither describes a parcel in motion.
const STEPS: { code: PublicOrderStatusCode; label: string; blurb: string }[] = [
  { code: "PREPARING", label: "Preparing your book", blurb: "We're putting your story together." },
  { code: "PROCESSING", label: "Getting ready to ship", blurb: "Your book is printed and being packed." },
  { code: "SHIPPED", label: "On the way", blurb: "Your parcel is with the courier." },
  { code: "DELIVERED", label: "Delivered", blurb: "Enjoy the story!" },
];

function fmt(date: string | null) {
  return date ? format(new Date(date), "d MMM yyyy") : null;
}

export function OrderTrackingTimeline({
  tracking,
  orderCreatedAt,
  isLoading,
}: {
  tracking: UserOrderTracking | undefined;
  orderCreatedAt: string;
  isLoading: boolean;
}) {
  const currentIndex = tracking
    ? STEPS.findIndex((s) => s.code === tracking.status.code)
    : -1;

  // Dates only exist once a stage has actually happened, so most render blank
  // until they do.
  const stepDates: (string | null)[] = [
    fmt(orderCreatedAt),
    fmt(tracking?.pickupScheduledDate ?? null),
    fmt(tracking?.shippedAt ?? null),
    fmt(tracking?.deliveredAt ?? null),
  ];

  return (
    <div className="p-6 bg-white rounded-2xl border-2 border-[#914A8C]/20 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="font-bold text-gray-900">Where your book is</h2>
        {tracking?.courierName && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Truck size={14} />
            {tracking.courierName}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <Loader2 size={16} className="animate-spin" />
          Checking the latest update…
        </div>
      ) : (
        <ol className="space-y-0">
          {STEPS.map((step, i) => {
            const isDone = currentIndex >= 0 && i < currentIndex;
            const isCurrent = i === currentIndex;
            const isReached = isDone || isCurrent;
            const date = stepDates[i];
            const isLast = i === STEPS.length - 1;

            return (
              <li key={step.code} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                      isCurrent
                        ? "bg-[#914A8C] border-[#914A8C] text-white"
                        : isDone
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white border-gray-200 text-gray-300"
                    }`}
                  >
                    {isDone ? (
                      <Check size={16} strokeWidth={3} />
                    ) : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 min-h-[2.5rem] ${
                        isDone ? "bg-emerald-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>

                <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
                  <div
                    className={`font-bold text-sm ${
                      isReached ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </div>
                  <div
                    className={`text-sm mt-0.5 ${
                      isReached ? "text-gray-500" : "text-gray-300"
                    }`}
                  >
                    {step.blurb}
                  </div>
                  {date && isReached && (
                    <div className="text-xs text-gray-400 mt-1 font-medium">{date}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
