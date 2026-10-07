"use client";

import Link from "next/link";
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  PackageCheck,
  Ruler,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import type { NeedsAttention } from "@/app/types/stats";
import { cn } from "@/lib/utils";

/**
 * The band that earns this page daily.
 *
 * Two rules it follows:
 *   1. A card only renders when its count is above zero. Six permanently
 *      visible zeroes train the eye to skip the whole band, which defeats it.
 *   2. Tones come from the same palette as OrderStatusBadge, so red and amber
 *      mean the same thing here as they do on the orders table.
 *
 * Every card deep-links to the pre-filtered orders list. That only works
 * because the orders page reads `?status=` out of the URL — see the
 * searchParams handling there.
 */

type Tone = "critical" | "warning" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  critical: "bg-red-100 border-red-300 text-red-900 hover:border-red-400",
  warning: "bg-amber-100 border-amber-300 text-amber-900 hover:border-amber-400",
  neutral:
    "bg-white/70 border-[#914A8C]/15 text-neutral-800 hover:border-[#914A8C]/40",
};

const TONE_ICON: Record<Tone, string> = {
  critical: "text-red-600",
  warning: "text-amber-700",
  neutral: "text-[#914A8C]",
};

type AttentionItem = {
  key: keyof NeedsAttention;
  label: string;
  icon: LucideIcon;
  tone: Tone;
  href: string;
};

// Ordered by urgency — a failed shipment is a paid customer whose book is
// stuck, an open feedback message is not. Enquiries sit above feedback for the
// same reason: someone is waiting on a reply, where feedback expects none.
const ITEMS: AttentionItem[] = [
  {
    key: "shiprocketFailed",
    label: "Shiprocket failed",
    icon: AlertOctagon,
    tone: "critical",
    href: "/admin/orders?status=SHIPROCKET_FAILED",
  },
  {
    key: "awaitingDimensions",
    label: "Awaiting dimensions",
    icon: Ruler,
    tone: "warning",
    href: "/admin/orders?status=READY_TO_SHIP",
  },
  {
    key: "awaitingCustomerSelection",
    label: "Awaiting customer",
    icon: UserCheck,
    tone: "neutral",
    href: "/admin/orders?status=GENERATED",
  },
  {
    key: "staleTracking",
    label: "Tracking gone quiet",
    icon: PackageCheck,
    tone: "neutral",
    href: "/admin/orders?status=SHIPPED",
  },
  {
    key: "abandonedCheckouts",
    label: "Abandoned checkouts",
    icon: Clock,
    tone: "neutral",
    href: "/admin/orders?status=CREATED",
  },
  {
    key: "openEnquiries",
    label: "Open enquiries",
    icon: Mail,
    tone: "neutral",
    href: "/admin/contact-enquiries",
  },
  {
    key: "openFeedback",
    label: "Open feedback",
    icon: MessageSquare,
    tone: "neutral",
    href: "/admin/feedback",
  },
];

export function NeedsAttentionPanel({
  needsAttention,
}: {
  needsAttention: NeedsAttention;
}) {
  const visible = ITEMS.filter((item) => needsAttention[item.key] > 0);

  if (visible.length === 0) {
    return (
      <div className="flex items-center gap-3 py-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <p className="font-bold text-neutral-900">
            Nothing needs your attention
          </p>
          <p className="text-sm text-neutral-500">
            No failed shipments, nothing waiting to be packed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {visible.map((item) => {
        const count = needsAttention[item.key];

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "rounded-2xl border p-4 transition-colors backdrop-blur-sm",
              TONE_STYLES[item.tone]
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <item.icon
                className={cn("w-4 h-4 shrink-0", TONE_ICON[item.tone])}
              />
              <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                {item.label}
              </span>
            </div>
            <div className="text-2xl font-black tabular-nums">{count}</div>
          </Link>
        );
      })}
    </div>
  );
}
