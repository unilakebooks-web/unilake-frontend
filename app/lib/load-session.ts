import { getSession } from "@/app/actions/session";
import type { SessionSnapshot } from "@/app/types/session";

/**
 * Loads a session for a server component, retrying transient failures.
 *
 * WHY THIS EXISTS
 * The session fetch can fail for reasons that have nothing to do with the
 * session: the backend restarting, or Neon waking from sleep and dropping the
 * first query (see the cold-start note in the backend's CURRENT_STATE.md). Both
 * succeed a moment later. Before this, a single one of those blips sent the
 * customer to the homepage with no explanation, mid-flow.
 *
 * WHAT IT DOES NOT RETRY
 * A 404 is a real answer, not a blip — that session does not exist and never
 * will. Retrying it just makes the user wait longer for the same outcome, so it
 * returns immediately and is reported separately from a transient failure.
 */

const MAX_ATTEMPTS = 3;

/** Backoff before attempts 2 and 3. Short, because a person is waiting. */
const RETRY_DELAYS_MS = [200, 500];

export type LoadSessionResult =
  | { ok: true; snapshot: SessionSnapshot }
  /** The session genuinely does not exist. Not worth retrying, not recoverable. */
  | { ok: false; reason: "not-found" }
  /** Something transient failed and kept failing. A retry may well work. */
  | { ok: false; reason: "unreachable"; message: string };

/** The shape the axios interceptor rejects with. */
interface ApiError {
  code?: string;
  message?: string;
}

function isNotFound(error: unknown): boolean {
  const code = (error as ApiError | null)?.code;
  return code === "NOT_FOUND";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loadSessionWithRetry(
  sessionId: string,
  context: string,
): Promise<LoadSessionResult> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const snapshot = await getSession(sessionId);
      return { ok: true, snapshot };
    } catch (error) {
      lastError = error;

      if (isNotFound(error)) {
        return { ok: false, reason: "not-found" };
      }

      if (attempt < MAX_ATTEMPTS) {
        // Log every failed attempt with the FIELDS, not the object. The axios
        // interceptor rejects with a plain { code, message }, and logging the
        // object itself renders as a useless "{}" in the Next.js dev overlay —
        // which is exactly how this class of bug stayed a mystery.
        console.warn(
          `[${context}] session fetch attempt ${attempt} failed, retrying:`,
          (error as ApiError | null)?.code,
          (error as ApiError | null)?.message,
        );

        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 500);
      }
    }
  }

  const apiError = lastError as ApiError | null;

  console.error(
    `[${context}] session fetch failed after ${MAX_ATTEMPTS} attempts:`,
    apiError?.code,
    apiError?.message,
  );

  return {
    ok: false,
    reason: "unreachable",
    message: apiError?.message ?? "We couldn't reach the server.",
  };
}
