import api from "@/app/lib/axios";
import type {
  CanaryResult,
  DeletionGroupName,
  DeletionOverview,
  DeletionRetryPayload,
  UndoGhostPayload,
  UndoGhostResult,
  UpdateDeletionGroupPayload,
} from "@/app/types/dataDeletion";

// Admin (Master only)
export async function fetchDataDeletion(): Promise<DeletionOverview> {
  const { data } = await api.get<DeletionOverview>("/api/admin/data-deletion");
  return data;
}

export async function updateDeletionGroup(
  group: DeletionGroupName,
  payload: UpdateDeletionGroupPayload,
): Promise<unknown> {
  const { data } = await api.patch<unknown>(
    `/api/admin/data-deletion/${group}`,
    payload,
  );
  return data;
}

export async function runStorageCheck(): Promise<CanaryResult> {
  const { data } = await api.post<CanaryResult>(
    "/api/admin/data-deletion/canary",
  );
  return data;
}

export async function retryDeletionItems(
  payload: DeletionRetryPayload,
): Promise<{ retried: number }> {
  const { data } = await api.post<{ retried: number }>(
    "/api/admin/data-deletion/retry",
    payload,
  );
  return data;
}

export async function releaseDeletionItem(
  itemId: string,
): Promise<{ released: true }> {
  const { data } = await api.post<{ released: true }>(
    "/api/admin/data-deletion/release",
    { itemId },
  );
  return data;
}

export async function undoDeletionGhost(
  payload: UndoGhostPayload,
): Promise<UndoGhostResult> {
  const { data } = await api.post<UndoGhostResult>(
    "/api/admin/data-deletion/undo-ghost",
    payload,
  );
  return data;
}
