"use client";

import { Eye } from "lucide-react";
import { useOrdersPaused } from "@/hooks/useSiteSettings";
import { cn } from "@/lib/utils";

/**
 * Shown on the comic page while the store is not accepting orders.
 *
 * This is NOT what stops an order — the backend rejects checkout on its own,
 * and the preview page's "Continue to checkout" button stops the customer
 * before they ever reach an address form. This exists so they know before
 * picking a comic, uploading a photo and waiting out a generation.
 *
 * Fails open via useOrdersPaused — see that hook for why absence of data has to
 * mean "open".
 */
export function OrdersPausedBanner({ className }: { className?: string }) {
  const ordersPaused = useOrdersPaused();

  if (!ordersPaused) return null;

  return (
    <div
      role="status"
      className={cn(
        "w-full bg-[#FFF4D6] border-2 border-[#FFD54A] text-[#3F3C95] rounded-2xl p-5 flex items-start gap-4 shadow-sm",
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-[#FFD54A] flex items-center justify-center shrink-0">
        <Eye size={20} className="text-[#3F3C95]" />
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-lg leading-tight mb-1">
          We&apos;re not accepting orders right now
        </h3>
        <p className="text-sm text-[#3F3C95]/80">
          Feel free to preview any comic you like — personalising and previewing
          still work exactly as normal. Ordering will be back soon.
        </p>
      </div>
    </div>
  );
}
