// Pure rules for the offers list on the checkout page: no React, so they can be tested on their own.
import type { CouponOffer } from "@/app/types/coupon";

/** How many offers show before "Show N more". */
export const OFFERS_VISIBLE = 3;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** "Offers for you" when any offer is reserved for this customer, otherwise "Available offers". */
export function offersHeading(offers: CouponOffer[]): string {
  return offers.some((offer) => offer.forYou) ? "Offers for you" : "Available offers";
}

/** The offers to list now, and how many are held back behind "Show N more". */
export function splitOffers(
  offers: CouponOffer[],
  showAll: boolean,
  limit: number = OFFERS_VISIBLE
): { shown: CouponOffer[]; hiddenCount: number } {
  if (showAll || offers.length <= limit) return { shown: offers, hiddenCount: 0 };
  return { shown: offers.slice(0, limit), hiddenCount: offers.length - limit };
}

/** "Ends 31 Dec" (the day as read in IST, where the admin set it), or null when there is no end. */
export function endsText(endsAt: string | null): string | null {
  if (!endsAt) return null;
  const time = new Date(endsAt).getTime();
  if (Number.isNaN(time)) return null;
  const day = new Date(time + IST_OFFSET_MS).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `Ends ${day}`;
}
