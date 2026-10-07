import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendToPrint } from "@/app/actions/session";
import type { SendToPrintSelection } from "@/app/types/session";

export function useSendToPrint(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (selections: SendToPrintSelection[]) => sendToPrint(sessionId, selections),
    onSuccess: () => {
      // The session is now CONFIRMED. Without this, navigating back would render
      // the cached PAID_PAGES_READY view and offer to send to print again.
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}
