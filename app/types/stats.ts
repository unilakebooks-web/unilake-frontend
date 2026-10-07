import type { CoverType } from "@/app/types/comic";
import type { OrderStatus } from "@/app/types/order";

// Response shapes for GET /api/admin/stats/* — the admin overview dashboard.
//
// Conventions carried over from app/types/order.ts:
//   - money is a STRING, never a number (Prisma serialises Decimal that way,
//     and parsing it to a float is how totals quietly lose a paisa)
//   - dates are ISO strings, parsed at the render site
//   - OrderStatus / CoverType are imported, never redeclared

export type StatsRange = "7d" | "30d" | "all";

export const STATS_RANGES: { value: StatsRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

// ============================================================
// SUMMARY
// ============================================================

/**
 * One row per currency — deliberately an array, not a scalar.
 *
 * Totals are never summed across currencies. Only INR is active today, so this
 * has exactly one entry in practice, but the shape is what lets a second market
 * be switched on with a DB row and no frontend change.
 */
export interface RevenueBucket {
  currency: string;
  total: string;
  orderCount: number;
  averageOrderValue: string;
}

/** Lifetime figures carry no AOV — an average only means something over a period. */
export interface LifetimeBucket {
  currency: string;
  total: string;
  orderCount: number;
}

/**
 * Live counts, NOT filtered by the selected range.
 *
 * These answer "what needs a human right now", so a 40-day-old order that still
 * has to be packed must appear even when the range is 7 days.
 */
export interface NeedsAttention {
  shiprocketFailed: number;
  awaitingCustomerSelection: number;
  awaitingDimensions: number;
  abandonedCheckouts: number;
  staleTracking: number;
  openFeedback: number;
  /** Unanswered /contact submissions. Counted apart from feedback — a waiting customer. */
  openEnquiries: number;
}

export interface TopComic {
  comicId: string;
  title: string;
  /** Primary thumbnail. Null on a comic that has none uploaded. */
  coverThumbnailUrl: string | null;
  currency: string;
  orderCount: number;
  revenue: string;
}

/** Narrower than AdminOrderRow — the overview list shows six fields, not twelve. */
export interface OverviewOrderRow {
  id: string;
  createdAt: string;
  customerName: string | null;
  childName: string | null;
  comicTitle: string;
  amount: string;
  currency: string;
  status: OrderStatus;
}

export interface StatsSummary {
  range: StatsRange;
  /** Range-filtered. */
  revenue: RevenueBucket[];
  /** All time, regardless of range. */
  lifetime: LifetimeBucket[];
  /** Live snapshot. Every OrderStatus key is present, zeros included. */
  ordersByStatus: Record<OrderStatus, number>;
  /** Range-filtered. */
  coverTypeSplit: Record<CoverType, number>;
  needsAttention: NeedsAttention;
  topComics: TopComic[];
  recentOrders: OverviewOrderRow[];
}

// ============================================================
// TIMESERIES
// ============================================================

/** "day" for 7d/30d, "month" for all-time. Drives axis label formatting. */
export type StatsGranularity = "day" | "month";

export interface TimeseriesPoint {
  /** "YYYY-MM-DD", already cut on IST day boundaries by the backend. */
  date: string;
  currency: string;
  orders: number;
  revenue: string;
}

export interface StatsTimeseries {
  range: StatsRange;
  granularity: StatsGranularity;
  /**
   * Zero-filled server-side: every bucket in the range is present even with no
   * orders, so the chart never has to distinguish "no data" from "a quiet day".
   * Empty only when the range contains no orders at all.
   */
  points: TimeseriesPoint[];
}

// ============================================================
// CONTENT HEALTH
// ============================================================

export interface ContentHealth {
  comics: {
    published: number;
    draft: number;
    unpublished: number;
    publishedMissingPricing: number;
    publishedWithIncompleteMrp: number;
  };
  homepage: {
    activeHeroImages: number;
    activeAnnouncements: number;
    /**
     * The REAL publish rule, evaluated server-side: active AND has a video AND
     * has at least one step. Stricter than the `isActive` toggle the admin sees
     * in the How It Works editor, so a section can look live there and still
     * return null to the homepage.
     */
    howItWorksReady: boolean;
    activeCustomerReviews: number;
    activeGoogleReviews: number;
    activeTeamMembers: number;
  };
  content: {
    activeFaqsHome: number;
    activeFaqsComic: number;
    publishedBlogs: number;
  };
  legal: {
    privacyActive: boolean;
    termsActive: boolean;
    refundActive: boolean;
  };
  settings: {
    siteSettingsSaved: boolean;
    contactEmailSet: boolean;
    contactPhoneSet: boolean;
  };
  countries: {
    active: number;
  };
}
