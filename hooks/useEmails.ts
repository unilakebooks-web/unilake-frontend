import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelBroadcast,
  createBroadcast,
  deleteBroadcast,
  fetchAudienceCounts,
  fetchBroadcast,
  fetchBroadcastPreview,
  fetchBroadcasts,
  fetchMarketingConsent,
  fetchReminderSettings,
  fetchReminderStatus,
  saveMarketingConsent,
  saveReminderSettings,
  sendBroadcastTest,
  startBroadcast,
  updateBroadcast,
} from "@/app/actions/email";
import type { BroadcastPayload, MarketingConsent } from "@/app/types/email";

/** How often the open screens refresh themselves, in milliseconds. */
const STATUS_REFRESH_MS = 60_000;
const BROADCAST_PROGRESS_REFRESH_MS = 15_000;

export function useReminderSettings() {
  return useQuery({
    queryKey: ["admin-reminder-settings"],
    queryFn: fetchReminderSettings,
  });
}

export function useReminderStatus() {
  return useQuery({
    queryKey: ["admin-reminder-status"],
    queryFn: fetchReminderStatus,
    refetchInterval: STATUS_REFRESH_MS,
  });
}

export function useSaveReminderSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveReminderSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reminder-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reminder-status"] });
    },
  });
}

export function useBroadcasts() {
  return useQuery({ queryKey: ["admin-broadcasts"], queryFn: fetchBroadcasts });
}

export function useAudienceCounts() {
  return useQuery({
    queryKey: ["admin-broadcast-audience"],
    queryFn: fetchAudienceCounts,
  });
}

/** Polls while the broadcast is sending so the counts move. */
export function useBroadcast(id: string | null) {
  return useQuery({
    queryKey: ["admin-broadcast", id],
    queryFn: () => fetchBroadcast(id as string),
    enabled: id !== null,
    refetchInterval: (query) =>
      query.state.data?.status === "SENDING"
        ? BROADCAST_PROGRESS_REFRESH_MS
        : false,
  });
}

export function useBroadcastPreview(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-broadcast-preview", id],
    queryFn: () => fetchBroadcastPreview(id as string),
    enabled: id !== null && enabled,
    staleTime: 0,
  });
}

function useInvalidateBroadcasts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin-broadcasts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-broadcast"] });
    queryClient.invalidateQueries({ queryKey: ["admin-broadcast-preview"] });
    queryClient.invalidateQueries({ queryKey: ["admin-broadcast-audience"] });
    queryClient.invalidateQueries({ queryKey: ["admin-reminder-status"] });
  };
}

export function useCreateBroadcast() {
  const invalidate = useInvalidateBroadcasts();
  return useMutation({
    mutationFn: (payload: BroadcastPayload) => createBroadcast(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateBroadcast() {
  const invalidate = useInvalidateBroadcasts();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<BroadcastPayload>;
    }) => updateBroadcast(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteBroadcast() {
  const invalidate = useInvalidateBroadcasts();
  return useMutation({ mutationFn: deleteBroadcast, onSuccess: invalidate });
}

export function useSendBroadcastTest() {
  return useMutation({ mutationFn: sendBroadcastTest });
}

export function useStartBroadcast() {
  const invalidate = useInvalidateBroadcasts();
  return useMutation({
    mutationFn: ({ id, count }: { id: string; count: number }) =>
      startBroadcast(id, count),
    onSuccess: invalidate,
  });
}

export function useCancelBroadcast() {
  const invalidate = useInvalidateBroadcasts();
  return useMutation({ mutationFn: cancelBroadcast, onSuccess: invalidate });
}

/** The checkout box. Only runs for a signed-in customer. */
export function useMarketingConsent(userId: string | null) {
  // Keyed by the signed-in user, so a second person on the same browser never sees the first one's choice.
  return useQuery({
    queryKey: ["marketing-consent", userId],
    queryFn: fetchMarketingConsent,
    enabled: userId !== null,
  });
}

export function useSaveMarketingConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveMarketingConsent,
    onSuccess: (data) =>
      queryClient.setQueriesData<MarketingConsent>(
        { queryKey: ["marketing-consent"] },
        (old) => (old ? { ...old, optedIn: data.optedIn } : old),
      ),
  });
}
