import api from "@/app/lib/axios";
import type { CreatedShare, ShareState, SharedBook } from "@/app/types/share";

export async function getShareState(sessionId: string): Promise<ShareState> {
  const { data } = await api.get<ShareState>(`/api/public/sessions/${sessionId}/share`);
  return data;
}

export async function createShare(sessionId: string, showName?: boolean): Promise<CreatedShare> {
  const { data } = await api.post<CreatedShare>(
    `/api/public/sessions/${sessionId}/share`,
    showName === undefined ? undefined : { showName }
  );
  return data;
}

export async function stopSharing(sessionId: string): Promise<void> {
  await api.delete(`/api/public/sessions/${sessionId}/share`);
}

/** The shared book for a share link. A dead link rejects with { code: "NOT_FOUND" }. */
export async function fetchSharedBook(token: string): Promise<SharedBook> {
  const { data } = await api.get<SharedBook>(`/api/public/shares/${token}`);
  return data;
}
