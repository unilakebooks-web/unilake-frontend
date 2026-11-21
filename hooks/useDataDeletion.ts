import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDataDeletion,
  releaseDeletionItem,
  retryDeletionItems,
  runStorageCheck,
  undoDeletionGhost,
  updateDeletionGroup,
} from "@/app/actions/dataDeletion";
import type {
  DeletionGroupName,
  UpdateDeletionGroupPayload,
} from "@/app/types/dataDeletion";

/** How often the open screen refreshes itself, in milliseconds. */
const STATUS_REFRESH_MS = 60_000;

const QUERY_KEY = ["admin-data-deletion"];

export function useDataDeletion() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchDataDeletion,
    refetchInterval: STATUS_REFRESH_MS,
  });
}

function useInvalidateDataDeletion() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
}

export function useUpdateDeletionGroup() {
  const invalidate = useInvalidateDataDeletion();
  return useMutation({
    mutationFn: ({
      group,
      payload,
    }: {
      group: DeletionGroupName;
      payload: UpdateDeletionGroupPayload;
    }) => updateDeletionGroup(group, payload),
    onSuccess: invalidate,
    // A refused change (a newer report, a change by someone else) means the screen is out of date.
    onError: invalidate,
  });
}

export function useRunStorageCheck() {
  const invalidate = useInvalidateDataDeletion();
  return useMutation({ mutationFn: runStorageCheck, onSuccess: invalidate });
}

export function useRetryDeletionItems() {
  const invalidate = useInvalidateDataDeletion();
  return useMutation({ mutationFn: retryDeletionItems, onSuccess: invalidate });
}

export function useReleaseDeletionItem() {
  const invalidate = useInvalidateDataDeletion();
  return useMutation({ mutationFn: releaseDeletionItem, onSuccess: invalidate });
}

export function useUndoDeletionGhost() {
  const invalidate = useInvalidateDataDeletion();
  return useMutation({ mutationFn: undoDeletionGhost, onSuccess: invalidate });
}
