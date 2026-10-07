import api from "@/app/lib/axios";
import type { AdminComicFact, ComicFactPlacement } from "@/app/types/comic";

/**
 * Admin CRUD for a comic's rotating facts.
 *
 * The public site does NOT use any of these — it reads facts off the comic
 * detail endpoint, which already ships them. These calls exist only for the
 * Facts tab in the admin panel, which additionally needs to see and manage
 * switched-off facts.
 */

/** Includes inactive facts. Omit `placement` to get both lists at once. */
export async function fetchComicFacts(
  comicId: string,
  placement?: ComicFactPlacement
): Promise<AdminComicFact[]> {
  const query = placement ? `?placement=${placement}` : "";
  const { data } = await api.get<AdminComicFact[]>(
    `/api/admin/comics/${comicId}/facts${query}`
  );
  return data;
}

export async function createComicFact(
  comicId: string,
  payload: { placement: ComicFactPlacement; text: string }
): Promise<AdminComicFact> {
  const { data } = await api.post<AdminComicFact>(
    `/api/admin/comics/${comicId}/facts`,
    payload
  );
  return data;
}

export async function updateComicFact(
  factId: string,
  payload: { placement?: ComicFactPlacement; text?: string }
): Promise<AdminComicFact> {
  const { data } = await api.patch<AdminComicFact>(
    `/api/admin/facts/${factId}`,
    payload
  );
  return data;
}

export async function toggleComicFactStatus(
  factId: string
): Promise<AdminComicFact> {
  const { data } = await api.patch<AdminComicFact>(
    `/api/admin/facts/${factId}/status`
  );
  return data;
}

export async function deleteComicFact(factId: string): Promise<void> {
  await api.delete(`/api/admin/facts/${factId}`);
}
