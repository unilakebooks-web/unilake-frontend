const STORAGE_KEY_PREFIX = "unilake_session_";

/**
 * How long a stored session is kept before it is forgotten. Mirrors the
 * backend's session lifetime (`SESSION_LIFETIME_DAYS` in the backend's
 * session.service.ts) — two repos, so change both together, along with the
 * "Previews are kept for…" message on the preview page.
 */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Session IDs reach us from the URL and from localStorage, so they can be truncated,
 * hand-edited or left over from an older build. Only `/generate` and `/regenerate`
 * validate the format server-side — on GET and PATCH a malformed ID goes straight to
 * the database and comes back as a 500, not a 404 (§13.1).
 *
 * Checking the shape first turns that into an immediate, honest "start again".
 */
export function isValidSessionId(id: string | null | undefined): id is string {
  return !!id && UUID_PATTERN.test(id);
}

interface StoredSession {
  sessionId: string;
  wsRoomToken: string;
  comicId: string;
  createdAt: string; // ISO timestamp
  childName?: string;
}

const PRELOADER_KEY_PREFIX = "unilake_preloader_";

export function setShowPreloader(sessionId: string): void {
  try {
    sessionStorage.setItem(`${PRELOADER_KEY_PREFIX}${sessionId}`, "1");
  } catch {}
}

export function consumeShowPreloader(sessionId: string): boolean {
  try {
    const val = sessionStorage.getItem(`${PRELOADER_KEY_PREFIX}${sessionId}`);
    if (val) {
      sessionStorage.removeItem(`${PRELOADER_KEY_PREFIX}${sessionId}`);
      return true;
    }
  } catch {}
  return false;
}

export function getSessionBySessionId(sessionId: string): StoredSession | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw) as StoredSession;
      if (data.sessionId === sessionId) return data;
    }
  } catch {}
  return null;
}

export function saveSession(comicId: string, data: StoredSession): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${comicId}`, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save session to localStorage:", error);
  }
}

export function getSession(comicId: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${comicId}`);
    if (!raw) return null;

    const data = JSON.parse(raw) as StoredSession;

    // Never hand a malformed ID back to a caller — it would 500 on the first request.
    if (!isValidSessionId(data?.sessionId)) {
      clearSession(comicId);
      return null;
    }

    // TTL check
    const createdAt = new Date(data.createdAt).getTime();
    const now = Date.now();
    const ageMs = now - createdAt;

    // If older than the session lifetime, clear it and return null
    if (ageMs > SESSION_TTL_MS) {
      clearSession(comicId);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to parse session from localStorage:", error);
    return null;
  }
}

export function clearSession(comicId: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${comicId}`);
  } catch (error) {
    console.error("Failed to remove session from localStorage:", error);
  }
}
