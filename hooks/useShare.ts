import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createShare, getShareState, stopSharing } from "@/app/actions/share";

const shareStateKey = (sessionId: string) => ["share-state", sessionId];

/** Whether the customer can share this book and whether a link is live. A failure just means no Share button. */
export function useShareState(sessionId: string) {
  return useQuery({
    queryKey: shareStateKey(sessionId),
    queryFn: () => getShareState(sessionId),
    retry: false,
  });
}

export function useCreateShare(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (showName?: boolean) => createShare(sessionId, showName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shareStateKey(sessionId) }),
  });
}

export function useStopSharing(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => stopSharing(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: shareStateKey(sessionId) }),
  });
}
