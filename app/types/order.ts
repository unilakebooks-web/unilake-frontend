export type OrderStatus =
  | "CREATED"
  | "PAID"
  | "GENERATED"
  | "CONFIRMED"
  | "SHIPROCKET_FAILED"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUSES: OrderStatus[] = [
  "CREATED",
  "PAID",
  "GENERATED",
  "CONFIRMED",
  "SHIPROCKET_FAILED",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export type OrderSortBy = "createdAt" | "updatedAt";
export type SortOrder = "asc" | "desc";

export interface AdminOrdersFilters {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  search?: string;
  sortBy?: OrderSortBy;
  sortOrder?: SortOrder;
}

/**
 * The personalised page-1 image for one order — the cover this child's book
 * actually opens on, as opposed to `comic.coverThumbnailUrls`, which is the
 * marketing thumbnail of the template and is identical for every customer.
 */
export interface GeneratedCover {
  /** Web derivative (webp, 1600px). Falls back to the print master when absent. */
  imageUrl: string;
  variantIndex: number;
  /**
   * True once the customer sent the book to print — then this is literally the
   * cover that was printed. False means generation finished but the customer
   * has not confirmed their pick yet, so it can still change.
   */
  isSelected: boolean;
}

export interface AdminOrderRow {
  id: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  /** Prisma Decimal serialised — a string, never a number. */
  amount: string;
  currency: string;
  status: OrderStatus;
  trackingStatus: string | null;
  awbNumber: string | null;
  courierName: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  childName: string | null;
  comicTitle: string;
  /** Null when page 1 has not generated yet — render a placeholder, not the template art. */
  coverImageUrl: string | null;
}

export interface AdminOrdersPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminOrdersResponse {
  orders: AdminOrderRow[];
  pagination: AdminOrdersPagination;
}

export type PublicOrderStatusCode =
  | "AWAITING_PAYMENT"
  | "PREPARING"
  /**
   * Paid, every page generated, waiting on the customer to pick variants and
   * send to print. Nothing is happening server-side — the UI must prompt them.
   */
  | "AWAITING_SELECTION"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface PublicOrderStatus {
  code: PublicOrderStatusCode;
  label: string;
}

export interface AdminOrderDetail {
  id: string;
  createdAt: string;
  updatedAt: string;

  amount: string;
  currency: string;
  countryCode: string;
  coverType: "HARDCOVER" | "SOFTCOVER";

  status: OrderStatus;
  publicStatus: PublicOrderStatus;

  customer: {
    notificationEmail: string | null;
    /** Null when the session was never attached to a logged-in account. */
    user: { id: string; name: string | null; email: string } | null;
  };

  shipping: {
    name: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
    phone: string | null;
  };

  payment: {
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
  };

  pdf: {
    pdfUrl: string | null;
    pdfDownloadUrl: string | null;
    pdfDownloadExpiry: string | null;
  };

  shipment: {
    shiprocketOrderId: string | null;
    shiprocketShipmentId: string | null;
    awbNumber: string | null;
    courierId: number | null;
    courierName: string | null;
    /** Raw Shiprocket string — admin-only, never shown to customers. */
    trackingStatus: string | null;
    trackingUrl: string | null;
    trackingUpdatedAt: string | null;
    isInternational: boolean;
  };

  dimensions: {
    finalLength: number | null;
    finalBreadth: number | null;
    finalHeight: number | null;
    finalWeight: number | null;
  };

  timestamps: {
    awbGeneratedAt: string | null;
    labelGeneratedAt: string | null;
    pickupScheduledDate: string | null;
    pickupGeneratedAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  };

  session: {
    id: string;
    childName: string | null;
    pronounKey: "HE" | "SHE" | "THEY" | null;
    age: number | null;
    comic: { id: string; title: string; coverThumbnailUrls: string[] };
  };

  /** Null when page 1 has not generated yet — an order at CREATED, or a failed page 1. */
  generatedCover: GeneratedCover | null;

  webhookEvents: WebhookEvent[];
}

export interface WebhookEvent {
  id: string;
  source: string;
  eventId: string;
  eventType: string;
  processedAt: string;
  payloadJson: unknown;
}

// ============================================================
// CUSTOMER-FACING ORDERS (/api/user/orders)
// ============================================================
//
// The API also sends `trackingStatus` (raw Shiprocket text) on the list and
// detail responses, and `awbNumber` on the detail response. The backend
// designates both admin-only — getTrackingForUser says so explicitly and omits
// them, while these two endpoints send them anyway. They are deliberately
// absent from the types below so rendering one is a compile error rather than
// a judgement call.

export interface OrderComicSummary {
  id: string;
  title: string;
  coverThumbnailUrls: string[];
}

/**
 * The child's generated page 1 for their own order views. Same pick as the
 * admin's GeneratedCover (printed variant, else newest), plus the page's real
 * pixel size so it can be drawn at its true shape. width/height are null only
 * when the page has no recorded dimensions.
 */
export interface UserGeneratedCover extends GeneratedCover {
  width: number | null;
  height: number | null;
}

export interface UserOrderRow {
  id: string;
  /**
   * Links back into the personalize flow: resuming payment on an unpaid order,
   * and reaching the preview to finish an order awaiting selection.
   */
  sessionId: string;
  comic: OrderComicSummary;
  /** Null until page 1 has generated — fall back to comic.coverThumbnailUrls. */
  generatedCover: UserGeneratedCover | null;
  coverType: "HARDCOVER" | "SOFTCOVER";
  amount: string;
  currency: string;
  publicStatus: PublicOrderStatus;
  createdAt: string;
}

export interface UserOrderDetail {
  id: string;
  sessionId: string;
  comic: OrderComicSummary;
  /** Null until page 1 has generated — fall back to comic.coverThumbnailUrls. */
  generatedCover: UserGeneratedCover | null;
  coverType: "HARDCOVER" | "SOFTCOVER";
  amount: string;
  currency: string;
  publicStatus: PublicOrderStatus;
  shipping: {
    name: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
    phone: string | null;
  };
  pdfDownloadUrl: string | null;
  pdfDownloadExpiry: string | null;
  courierName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserOrderTracking {
  status: PublicOrderStatus;
  courierName: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  pickupScheduledDate: string | null;
  /** Internal bookkeeping — fetched but never shown to the customer. */
  trackingUpdatedAt: string | null;
}

export interface ConfirmDimensionsInput {
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ConfirmDimensionsResponse {
  awbCode: string;
  courierName: string;
  pickupScheduledDate: string | null;
}

export interface RetryShiprocketResponse {
  shiprocketOrderId: string;
  shiprocketShipmentId: string;
  status: "READY_TO_SHIP";
  /** True when Shiprocket already had the shipment and we only reconciled our DB. */
  recovered: boolean;
}

export interface LabelResponse {
  labelUrl: string;
  message: string;
}

export interface TrackActivity {
  date: string | null;
  courierStatus: string;
  activity: string;
  location: string;
  shiprocketStatusLabel: string;
}

export interface RefreshTrackingResponse {
  shiprocket: {
    /** "pending" means no courier scans yet — normal right after AWB assignment. */
    state: "pending" | "tracked";
    currentStatus: string;
    courierName: string;
    trackUrl: string;
    estimatedDelivery: string | null;
    activities: TrackActivity[];
    pickupDate: string | null;
    deliveredDate: string | null;
  };
  /** What actually changed in our DB. All null when only trackingUpdatedAt moved. */
  updated: {
    orderStatus: OrderStatus | null;
    trackingStatus: string | null;
    trackingUrl: string | null;
    courierName: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  };
}
