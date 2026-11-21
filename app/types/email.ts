// Reminder emails and the admin broadcast (feature 5). Shapes of the backend responses
// (Unilake-backend src/services/reminderSettings.service.ts, reminder.service.ts, broadcast.service.ts).

export type ReminderKind =
  "PREVIEW_UNFINISHED" | "BOOK_NOT_SENT" | "REVIEW_REQUEST";

export interface ReminderSettings {
  previewEnabled: boolean;
  previewOffsetsHours: number[];
  previewEffectiveFrom: string | null;
  bookEnabled: boolean;
  bookOffsetsHours: number[];
  bookEffectiveFrom: string | null;
  reviewEnabled: boolean;
  reviewOffsetsHours: number[];
  reviewEffectiveFrom: string | null;
  googleReviewUrl: string | null;
  reminderCouponCode: string | null;
  previewDeletionDays: number | null;
  dailyBudget: number;
  reminderReserve: number;
  perRunLimit: number;
  windowStartHour: number;
  windowEndHour: number;
}

/** Every field optional: omitted = unchanged, null clears the nullable ones. */
export type UpdateReminderSettingsPayload = Partial<
  Omit<
    ReminderSettings,
    "previewEffectiveFrom" | "bookEffectiveFrom" | "reviewEffectiveFrom"
  >
>;

export interface ReminderStatus {
  budget: {
    daily: number;
    reserve: number;
    remindersToday: number;
    broadcastToday: number;
  };
  dueNow: Record<ReminderKind, number>;
  today: { kind: ReminderKind; status: string; count: number }[];
  /** The report card: the last `days` days. */
  recent: {
    days: number;
    sentPreviewReminders: number;
    /** An unfinished-preview reminder was sent, then the customer started an order that is now paid. */
    boughtAfterReminder: number;
    refused: number;
    /** All addresses that have unsubscribed, ever. */
    optedOutTotal: number;
  };
}

export type BroadcastStatus = "DRAFT" | "SENDING" | "SENT" | "CANCELLED";
export type BroadcastAudience = "OPTED_IN_ONLY" | "OPTED_IN_AND_CUSTOMERS";

export interface Broadcast {
  id: string;
  subject: string;
  heading: string;
  message: string;
  buttonText: string | null;
  buttonUrl: string | null;
  audience: BroadcastAudience;
  status: BroadcastStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdByEmail: string;
  sendStartedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface BroadcastDetail extends Broadcast {
  progress: { pending: number; claimed: number; sent: number; failed: number };
}

export interface BroadcastPayload {
  subject: string;
  heading: string;
  message: string;
  buttonText: string | null;
  buttonUrl: string | null;
  audience: BroadcastAudience;
}

export interface AudienceCounts {
  optedInOnly: number;
  optedInAndCustomers: number;
  /** What a broadcast may send in a day at the current limits (budget minus the reminders' reserve). */
  dailyCapacity: number;
}

/** The checkout box: whether it is ticked, and whether this account's address can be trusted to tick it. */
export interface MarketingConsent {
  optedIn: boolean;
  canTick: boolean;
}

export interface BroadcastPreview {
  subject: string;
  html: string;
}

export type BroadcastTestResult =
  { sent: true } | { sent: false; reason: string };

/** What an unsubscribe link does: stop all promotions and review requests, or one order's reminders. */
export type UnsubscribeScope = "GLOBAL" | "ORDER_REMINDER";

/** What the public unsubscribe page learns about a link. The address is never included. */
export interface UnsubscribeInfo {
  found: boolean;
  scope: UnsubscribeScope | null;
}
