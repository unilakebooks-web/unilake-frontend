import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFeedbacks, updateFeedbackStatus, deleteFeedback } from "@/app/actions/feedback";
import { FeedbackStatus } from "@/app/types/feedback";

export function useFeedbacks(status?: FeedbackStatus) {
  return useQuery({
    queryKey: ["admin-feedbacks", status],
    queryFn: () => fetchFeedbacks(status),
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) => 
      updateFeedbackStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedbacks"] });
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedbacks"] });
    },
  });
}
