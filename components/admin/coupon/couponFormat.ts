import type { Coupon } from "@/app/types/coupon";
import { formatMoney } from "@/lib/utils";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** "YYYY-MM-DD" of an instant as read in IST (the admin enters dates in IST). */
export function toIstDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** "12 Dec 2026" for a date string from toIstDate. */
export function formatIstDate(iso: string | null): string {
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
  return "No dates";
}
