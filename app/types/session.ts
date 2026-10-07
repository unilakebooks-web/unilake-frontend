export type SessionStatus =
  | "CREATED"
  | "PHOTO_UPLOADED"
  | "GENERATING_PREVIEW"
  | "PREVIEW_READY"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "GENERATING_PAID"
  | "PAID_PAGES_READY"
  | "CONFIRMED"
  | "COMPILING_PDF"
  | "PDF_FAILED"
  | "SHIPMENT_QUEUED"
  | "SHIPMENT_FAILED"
  | "COMPLETED"
  | "FAILED";

export type PageVersionStatus =
  | "QUEUED"
  | "TEXT_STAMPING"
  | "TEXT_STAMPED"
  | "GENERATING_SD"
  | "SD_READY"
  | "FAILED";

export type PronounKey = "HE" | "SHE" | "THEY";

export interface Variant {
  pageVersionId: string;
  variantIndex: number;
  status: PageVersionStatus;
  /**
   * 🔴 Print master — a lossless PNG at print resolution, ~5 MB per page.
   * Do NOT render this. It exists for the PDF / printing pipeline.
   */
  finalImageUrl: string | null;
  /**
   * Web derivative — WebP, ~400 KB. This is what the UI should display.
   * Null on variants generated before this field existed, or where building it
   * failed, so always read it as `displayImageUrl ?? finalImageUrl`.
   */
  displayImageUrl: string | null;
  isSelected: boolean;
  errorMessage: string | null;
}

export interface SessionPage {
  pageId: string;
  pageNumber: number;
  isPreviewPage: boolean;
  hasFace: boolean;
  /**
   * The admin's uploaded page artwork — blank speech bubbles, no face swap.
   * Rendered blurred behind the paywall on locked pages. Null until the admin
   * attaches artwork to the page.
   */
  artworkUrl: string | null;
  /** Sharp-probed server-side. Null until artwork is attached. */
  artworkWidth: number | null;
  artworkHeight: number | null;
  variants: Variant[];
}

export interface SessionSnapshot {
  id: string;
  comicId: string;
  userId: string | null;
  childName: string | null;
  pronounKey: PronounKey | null;
  age: number | null;
  notificationEmail: string | null;
  coverType: "HARDCOVER" | "SOFTCOVER" | null;
  status: SessionStatus;
  bestPhotoUrl: string | null;      // private key — NOT renderable
  shippingName: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
  shippingPhone: string | null;
  wsRoomToken: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  isExpired: boolean;
  comic: {
    id: string;
    title: string;
    freePreviewPages: number;
    coverThumbnailUrls: string[];
  };
  pages: SessionPage[];
}

export interface CreateSessionResponse {
  id: string;
  comicId: string;
  status: string;
  wsRoomToken: string;
  createdAt: string;
  expiresAt: string;
}

export interface CheckoutResponse {
  orderId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
  displayAmount: string;
  notificationEmail: string | null;
}

export interface GenerateResponse {
  status: string;
  jobsEnqueued: number;
}

export interface RegenerateResponse {
  queued: boolean;
  pageNumber: number;
  variantIndex: number;
  hasPaid: boolean;
}

export interface SendToPrintSelection {
  pageNumber: number;
  variantIndex: number;
}

export interface SendToPrintResponse {
  sessionId: string;
  orderId: string;
  status: "CONFIRMED";
  pdfCompilationEnqueued: boolean;
}

export interface PhotoUploadUrlResponse {
  uploadUrl: string;
  key: string;
}

export interface PhotoConfirmResponse {
  session: SessionSnapshot;
}

// WebSocket event types
// Shapes are locked by the backend — see PREVIEW_GENERATION_API.md §8.1 and
// backend/src/websocket/event.ts. Note the field is `imageUrl`, NOT `finalImageUrl`
// (`finalImageUrl` is the name it takes on the Variant once stored in the snapshot).
export interface PageReadyEvent {
  type: "page:ready";
  pageNumber: number;
  variantIndex: number;
  /** Print master (~5 MB PNG) — maps onto `Variant.finalImageUrl`. Not for display. */
  imageUrl: string;
  /** Web derivative (~400 KB WebP) — what the UI renders. Null if it couldn't be built. */
  displayImageUrl: string | null;
  pageVersionId: string;
}

export interface PageErrorEvent {
  type: "page:error";
  pageNumber: number;
  variantIndex: number;
  // Raw backend text, truncated to 500 chars. Log it, never show it to a parent (§8.1).
  errorMessage: string;
  /**
   * False means the backend still has retries queued for this page — it is NOT
   * terminal, and the UI must keep showing "generating". Only `true` means every
   * attempt is spent.
   *
   * Optional because a frontend deployed ahead of the backend that added it will
   * receive events without the field; `undefined` is falsy, so those are treated
   * as non-final and the error simply surfaces via the next GET instead.
   */
  isFinal?: boolean;
}

export interface PreviewReadyEvent {
  type: "session:preview-ready";
}

export interface PaidReadyEvent {
  type: "session:paid-ready";
}

export type WSEvent = PageReadyEvent | PageErrorEvent | PreviewReadyEvent | PaidReadyEvent;

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler?: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void; escape?: boolean; confirm_close?: boolean };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open(): void;
      on(event: string, callback: (response: unknown) => void): void;
    };
  }
}
