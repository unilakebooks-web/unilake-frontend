// Coupon types, shared by the customer checkout and the admin panel.
// Money values are decimal STRINGS, exactly as the API sends them.

/** A coupon applied to an order, as the customer sees it. */
export interface AppliedCoupon {
  code: string;
  /** The admin's name for the coupon; null on an order that predates names. */
  name: string | null;
  /** Price before the coupon. */
  listAmount: string | null;
  discountAmount: string;
  /** What the customer pays. */
  finalAmount: string;
  currency: string;
}

/** A coupon offered on the checkout page; it works for this order right now. */
export interface CouponOffer {
  code: string;
  name: string;
  description: string | null;
  /** True when the coupon is reserved for this customer. */
  forYou: boolean;
  /** ISO instant, for "Ends 31 Dec". */
  endsAt: string | null;
  listAmount: string;
  discountAmount: string;
  finalAmount: string;
  currency: string;
}

export type CouponDiscountType = "PERCENT" | "FIXED";
export type CouponKind = "PUBLIC" | "SINGLE_USE";
export type CoverType = "HARDCOVER" | "SOFTCOVER";

/** A coupon as the admin API returns it. */
export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  kind: CouponKind;
  discountType: CouponDiscountType;
  percentOff: string | null;
  amountOff: string | null;
  maxDiscount: string | null;
  currency: string | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  restrictedToUserId: string | null;
  restrictedToUser: { id: string; name: string; email: string } | null;
  allComics: boolean;
  comics: { id: string; title: string }[];
  countryCodes: string[];
  coverTypes: CoverType[];
  combinable: boolean;
  /** Listed on the checkout page of customers it fits (public coupons only). */
  showAtCheckout: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Redeemed uses, and reservations still inside the window. */
  usage: { redeemed: number; reserved: number };
}

export interface CouponListResponse {
  coupons: Coupon[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CouponListFilters {
  page?: number;
  pageSize?: number;
  status?: "active" | "inactive";
  kind?: CouponKind;
  search?: string;
}

/**
 * The body of create and update. Numbers are numbers (the API validates them);
 * dates are "YYYY-MM-DD" and mean the start or end of that day in IST.
 * On update, `null` clears an optional field.
 */
export interface CouponInput {
  code?: string;
  /** Length of the code to generate when `code` is left out (4 to 32). */
  codeLength?: number;
  name: string;
  description?: string | null;
  kind: CouponKind;
  discountType: CouponDiscountType;
  percentOff?: number | null;
  amountOff?: number | null;
  maxDiscount?: number | null;
  currency?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  restrictedToUserId?: string | null;
  allComics: boolean;
  comicIds: string[];
  countryCodes: string[];
  coverTypes: CoverType[];
  combinable: boolean;
  showAtCheckout: boolean;
  isActive: boolean;
}

/** A registered account, as offered when a coupon is reserved for one customer. */
export interface CouponCustomer {
  id: string;
  name: string;
  email: string;
}
