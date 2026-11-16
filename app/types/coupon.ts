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
  isActive: boolean;
}

/** Bulk creation of single-use codes: a count instead of a code, kind and limit. */
export type GenerateCouponsInput = Omit<CouponInput, "code" | "kind" | "usageLimit"> & {
  count: number;
};
