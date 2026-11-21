// Automatic data deletion (feature 6). Shapes of the backend responses (Unilake-backend
// src/services/dataDeletion*.ts, GET/PATCH/POST /api/admin/data-deletion). Master admin only.

export type DeletionGroupName = "PREVIEWS" | "PHOTOS" | "BOOKS";
export type DeletionMode = "OFF" | "REPORT_ONLY" | "ACTIVE";
export type DeletionItemState = "CLAIMED" | "DONE" | "FAILED";

export interface DeletionReportLists {
  /** Items like "SESSION:<id>". */
  due: string[];
  failedClock: string[];
  legacyPdf: string[];
  keptOrders: string[];
  blocked: string[];
}

export interface DeletionReport {
  id: string;
  startedAt: string;
  selectionVersion: number;
  dueCount: number;
  ghostCount: number;
  objectCounts: Record<string, number> | null;
  proof: Record<string, string> | null;
  lists: DeletionReportLists | null;
}

export interface DeletionAttentionItem {
  id: string;
  scope: string;
  subjectId: string;
  state: DeletionItemState;
  ghost: boolean;
  attempts: number;
  lastError: string | null;
  claimedAt: string;
  updatedAt: string;
}

export interface DeletionGroup {
  group: DeletionGroupName;
  mode: DeletionMode;
  dailyMax: number;
  modeChangedAt: string;
  modeChangedByEmail: string | null;
  pausedReason: string | null;
  pausedAt: string | null;
  approvalExhaustedAt: string | null;
  selectionVersion: number;
  report: DeletionReport | null;
  items: {
    claimed: number;
    failed: number;
    oldestClaimedAt: string | null;
    oldestFailedAt: string | null;
    ghostsLast24h: number;
    ghostPauseMin: number;
  };
  /** Due now but outside the approved set; null when it does not apply. */
  dueNotApproved: number | null;
  attention: DeletionAttentionItem[];
}

export interface DeletionOverview {
  groups: DeletionGroup[];
  canary: {
    passedAt: string | null;
    attemptedAt: string | null;
    autoEnabled: boolean;
    validHours: number;
  };
  paidAfterDeletionOrders: number;
}

export interface UpdateDeletionGroupPayload {
  mode: DeletionMode;
  /** 1 to 500. */
  dailyMax?: number;
  /** The mode time the admin saw: a change made by someone else in between is refused. */
  expectedModeChangedAt?: string;
  /** To ACTIVE only: the report shown, its due count, and the typed "DELETE <dueCount>". */
  reportRunId?: string;
  dueCount?: number;
  confirmation?: string;
}

export interface CanaryResult {
  ran: boolean;
  passed: boolean;
}

export type DeletionRetryPayload = { itemId: string } | { group: DeletionGroupName };

export interface UndoGhostResult {
  undone: number;
  refused: { id: string; reason: string }[];
  /** More ghosts matched the time range than one request handles. */
  truncated: boolean;
}

export type UndoGhostPayload = { itemId: string } | { from: string; to: string };
