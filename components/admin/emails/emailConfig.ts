// ⚠️ Repeats limits from the backend (Unilake-backend src/config/reminders.ts, validators/reminder.schema.ts and
// validators/broadcast.schema.ts). Two repos, change both. The server checks every value again; these only give the
// admin a clear message before the request.
import type {
  ReminderKind,
  ReminderSettings,
  UpdateReminderSettingsPayload,
} from "@/app/types/email";

export const MAX_REMINDER_OFFSETS = 3;
const MAX_DAILY_BUDGET = 1000;
const MAX_PER_RUN_LIMIT = 50;
const MAX_PREVIEW_DELETION_DAYS = 7;
const WINDOW_START_MAX_HOUR = 23;
const WINDOW_END_MAX_HOUR = 24;
export const BROADCAST_SUBJECT_MAX = 150;
export const BROADCAST_HEADING_MAX = 120;
export const BROADCAST_MESSAGE_MAX = 5000;
export const BROADCAST_BUTTON_TEXT_MAX = 40;

interface ReminderKindInfo {
  kind: ReminderKind;
  enabledKey: "previewEnabled" | "bookEnabled" | "reviewEnabled";
  offsetsKey: "previewOffsetsHours" | "bookOffsetsHours" | "reviewOffsetsHours";
  title: string;
  summary: string;
  /** What the hours are counted from, shown under the times. */
  countedFrom: string;
  /** Largest send time in hours. */
  maxHours: number;
}

export const REMINDER_KIND_INFO: ReminderKindInfo[] = [
  {
    kind: "PREVIEW_UNFINISHED",
    enabledKey: "previewEnabled",
    offsetsKey: "previewOffsetsHours",
    title: "Unfinished preview",
    summary: "A free preview was made but nothing was bought.",
    countedFrom: "after the preview was made",
    maxHours: 6 * 24,
  },
  {
    kind: "BOOK_NOT_SENT",
    enabledKey: "bookEnabled",
    offsetsKey: "bookOffsetsHours",
    title: "Book not sent to print",
    summary:
      "Paid, the book is ready, but the customer has not pressed Send to Print. Nothing is printed until they do.",
    countedFrom: "after the book became ready",
    maxHours: 30 * 24,
  },
  {
    kind: "REVIEW_REQUEST",
    enabledKey: "reviewEnabled",
    offsetsKey: "reviewOffsetsHours",
    title: "Review request",
    summary:
      "The book was delivered. Asks for a short Google review. Needs the review link below.",
    countedFrom: "after delivery",
    maxHours: 40 * 24,
  },
];

export const STATUS_LABELS: Record<string, string> = {
  CLAIMED: "Being sent",
  SENT: "Sent",
  FAILED: "Refused",
  LOST: "Result unknown",
};

export const KIND_SHORT: Record<ReminderKind, string> = {
  PREVIEW_UNFINISHED: "Unfinished preview",
  BOOK_NOT_SENT: "Book not sent",
  REVIEW_REQUEST: "Review request",
};

/** Hours as a short phrase: 3 -> "3 hours", 24 -> "1 day", 36 -> "36 hours". */
function formatHours(hours: number): string {
  if (hours % 24 === 0) return hours === 24 ? "1 day" : `${hours / 24} days`;
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export interface ReminderFormValues {
  previewEnabled: boolean;
  previewOffsetsHours: string[];
  bookEnabled: boolean;
  bookOffsetsHours: string[];
  reviewEnabled: boolean;
  reviewOffsetsHours: string[];
  googleReviewUrl: string;
  reminderCouponCode: string;
  previewDeletionDays: string;
  dailyBudget: string;
  reminderReserve: string;
  perRunLimit: string;
  windowStartHour: string;
  windowEndHour: string;
}

export function toFormValues(s: ReminderSettings): ReminderFormValues {
  return {
    previewEnabled: s.previewEnabled,
    previewOffsetsHours: s.previewOffsetsHours.map(String),
    bookEnabled: s.bookEnabled,
    bookOffsetsHours: s.bookOffsetsHours.map(String),
    reviewEnabled: s.reviewEnabled,
    reviewOffsetsHours: s.reviewOffsetsHours.map(String),
    googleReviewUrl: s.googleReviewUrl ?? "",
    reminderCouponCode: s.reminderCouponCode ?? "",
    previewDeletionDays:
      s.previewDeletionDays === null ? "" : String(s.previewDeletionDays),
    dailyBudget: String(s.dailyBudget),
    reminderReserve: String(s.reminderReserve),
    perRunLimit: String(s.perRunLimit),
    windowStartHour: String(s.windowStartHour),
    windowEndHour: String(s.windowEndHour),
  };
}

const isWhole = (text: string): boolean => /^\d+$/.test(text.trim());

/** One message per problem, or an empty list. Mirrors the server rules. */
export function validateReminderForm(v: ReminderFormValues): string[] {
  const problems: string[] = [];
  for (const info of REMINDER_KIND_INFO) {
    const raw = v[info.offsetsKey];
    if (raw.length === 0)
      problems.push(`${info.title}: add at least one send time.`);
    if (raw.some((t) => !isWhole(t) || Number(t) < 1)) {
      problems.push(
        `${info.title}: send times must be whole hours, 1 or more.`,
      );
      continue;
    }
    const hours = raw.map(Number);
    if (hours.some((h) => h > info.maxHours)) {
      problems.push(
        `${info.title}: send times can be at most ${info.maxHours} hours.`,
      );
    }
    // `i > 0` means a previous send time exists; compare through a checked value, not an assertion.
    if (hours.some((h, i) => i > 0 && h <= (hours[i - 1] ?? 0))) {
      problems.push(
        `${info.title}: each send time must be later than the one before.`,
      );
    }
  }
  const n = (t: string) => (isWhole(t) ? Number(t) : NaN);
  if (!(n(v.dailyBudget) >= 1 && n(v.dailyBudget) <= MAX_DAILY_BUDGET)) {
    problems.push(
      `Daily budget must be a whole number from 1 to ${MAX_DAILY_BUDGET}.`,
    );
  }
  if (!(n(v.reminderReserve) >= 0))
    problems.push("Reserve must be a whole number, 0 or more.");
  else if (n(v.reminderReserve) > n(v.dailyBudget))
    problems.push("The reserve cannot be more than the daily budget.");
  // The deletion date in the last reminder must still be ahead when that reminder arrives.
  const deletionDays = n(v.previewDeletionDays);
  const lastPreviewSend = Math.max(...v.previewOffsetsHours.map(Number));
  if (
    v.previewDeletionDays.trim() !== "" &&
    Number.isFinite(lastPreviewSend) &&
    deletionDays * 24 <= lastPreviewSend
  ) {
    problems.push(
      "The deletion days must be longer than the last unfinished-preview send time.",
    );
  }
  if (!(n(v.perRunLimit) >= 1 && n(v.perRunLimit) <= MAX_PER_RUN_LIMIT)) {
    problems.push(
      `Per-run limit must be a whole number from 1 to ${MAX_PER_RUN_LIMIT}.`,
    );
  }
  if (!(
    n(v.windowStartHour) >= 0 &&
    n(v.windowStartHour) <= WINDOW_START_MAX_HOUR &&
    n(v.windowEndHour) >= 1 &&
    n(v.windowEndHour) <= WINDOW_END_MAX_HOUR
  )) {
    problems.push(
      `Sending hours: start 0 to ${WINDOW_START_MAX_HOUR}, end 1 to ${WINDOW_END_MAX_HOUR}.`,
    );
  } else if (n(v.windowStartHour) >= n(v.windowEndHour)) {
    problems.push("The sending window must start before it ends.");
  }
  if (
    v.previewDeletionDays.trim() !== "" &&
    !(
      n(v.previewDeletionDays) >= 1 &&
      n(v.previewDeletionDays) <= MAX_PREVIEW_DELETION_DAYS
    )
  ) {
    problems.push(
      `Deletion days must be a whole number from 1 to ${MAX_PREVIEW_DELETION_DAYS}, or empty.`,
    );
  }
  if (v.reviewEnabled && v.googleReviewUrl.trim() === "") {
    problems.push(
      "Add the Google review link before switching on the review reminder.",
    );
  }
  return problems;
}

export function toReminderPayload(
  v: ReminderFormValues,
): UpdateReminderSettingsPayload {
  return {
    previewEnabled: v.previewEnabled,
    previewOffsetsHours: v.previewOffsetsHours.map(Number),
    bookEnabled: v.bookEnabled,
    bookOffsetsHours: v.bookOffsetsHours.map(Number),
    reviewEnabled: v.reviewEnabled,
    reviewOffsetsHours: v.reviewOffsetsHours.map(Number),
    googleReviewUrl:
      v.googleReviewUrl.trim() === "" ? null : v.googleReviewUrl.trim(),
    reminderCouponCode:
      v.reminderCouponCode.trim() === "" ? null : v.reminderCouponCode.trim(),
    previewDeletionDays:
      v.previewDeletionDays.trim() === ""
        ? null
        : Number(v.previewDeletionDays),
    dailyBudget: Number(v.dailyBudget),
    reminderReserve: Number(v.reminderReserve),
    perRunLimit: Number(v.perRunLimit),
    windowStartHour: Number(v.windowStartHour),
    windowEndHour: Number(v.windowEndHour),
  };
}

/** The small label beside a send time: "3 hours", "1 day", or nothing while the box is empty or invalid. */
export function hoursLabel(text: string): string {
  return isWhole(text) && Number(text) > 0 ? formatHours(Number(text)) : "";
}
