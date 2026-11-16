import type { Coupon } from "@/app/types/coupon";
import { formatMoney } from "@/lib/utils";

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** "YYYY-MM-DD" of an instant as read in IST (the admin enters dates in IST). */
export function toIstDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Today's date in IST as "YYYY-MM-DD". */
export function todayInIst(): string {
  return toIstDate(new Date().toISOString());
}

/** "12 Dec 2026" for a date string from toIstDate. */
function formatIstDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${toIstDate(iso)}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function describeDiscount(coupon: Coupon): string {
  if (coupon.discountType === "PERCENT") {
    const pct = `${parseFloat(coupon.percentOff ?? "0")}% off`;
    return coupon.maxDiscount && coupon.currency
      ? `${pct}, up to ${formatMoney(coupon.maxDiscount, coupon.currency)}`
      : pct;
  }
  return `${formatMoney(coupon.amountOff ?? "0", coupon.currency ?? "INR")} off`;
}

export function describeValidity(coupon: Coupon): string {
  const from = formatIstDate(coupon.startsAt);
  const to = formatIstDate(coupon.endsAt);
  if (from && to) return `${from} to ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return "Always valid";
}

export type CouponStatus = "active" | "off" | "expired" | "scheduled" | "used up";

/** What an admin wants to know at a glance: can customers use this coupon right now? */
export function couponStatus(coupon: Coupon, now: Date = new Date()): CouponStatus {
  // Expired comes first: an expired coupon is switched off automatically, and "expired" says why.
  if (coupon.endsAt && new Date(coupon.endsAt) < now) return "expired";
  if (!coupon.isActive) return "off";
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return "scheduled";
  if (coupon.usageLimit !== null && coupon.usage.redeemed >= coupon.usageLimit) return "used up";
  return "active";
}
