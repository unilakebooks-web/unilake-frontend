// ⚠️ DAILY_MAX_LIMIT repeats the backend (Unilake-backend src/config/dataDeletion.ts, validators/dataDeletion.schema.ts).
// Two repos, change both. The server checks every value again; this only gives the admin a clear message first.
import { format } from "date-fns";
import type {
  DeletionGroupName,
  DeletionMode,
  DeletionReportLists,
} from "@/app/types/dataDeletion";

export const DAILY_MAX_MIN = 1;
export const DAILY_MAX_LIMIT = 500;

/** How many ids a list shows at a time. */
export const LIST_PAGE_SIZE = 25;

export const GROUP_INFO: Record<
  DeletionGroupName,
  { title: string; summary: string }
> = {
  PREVIEWS: {
    title: "Unpaid previews",
    summary:
      "The photo and preview pages of free previews that nobody paid for, 7 days after they were made.",
  },
  PHOTOS: {
    title: "Photos of paid books",
    summary: "The child's photo, 3 days after the book was delivered.",
  },
  BOOKS: {
    title: "Delivered books",
    summary:
      "The book's pages, the print PDF and the address history, 45 days after delivery, and the files of retired comics.",
  },
};

export const MODE_INFO: Record<
  DeletionMode,
  { label: string; explanation: string }
> = {
  OFF: {
    label: "Off",
    explanation: "Nothing is checked and nothing is deleted.",
  },
  REPORT_ONLY: {
    label: "Report only",
    explanation:
      "Every few hours it works out what would be deleted and writes a report. Nothing is deleted.",
  },
  ACTIVE: {
    label: "Active",
    explanation:
      "Deletes what is due, automatically, up to the daily maximum. It cannot be undone.",
  },
};

export const MODES: DeletionMode[] = ["OFF", "REPORT_ONLY", "ACTIVE"];

export const LIST_INFO: {
  key: keyof DeletionReportLists;
  title: string;
  hint: string;
}[] = [
  { key: "due", title: "Due now", hint: "Would be deleted." },
  {
    key: "failedClock",
    title: "Delivery time looks wrong",
    hint: "Never deleted: the delivery time is missing or not believable.",
  },
  {
    key: "legacyPdf",
    title: "PDF at another place",
    hint: "Not deleted: the stored PDF is not where the rules expect it.",
  },
  {
    key: "keptOrders",
    title: "Orders kept",
    hint: "Cancelled or failed shipping: never deleted.",
  },
  {
    key: "blocked",
    title: "Skipped",
    hint: "Held back for now, for example a payment in progress.",
  },
];

/** A time as the admin pages show it. */
export const when = (iso: string): string => format(new Date(iso), "dd MMM yyyy, HH:mm");
