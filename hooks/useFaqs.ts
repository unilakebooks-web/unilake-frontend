import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFaqs,
  createFaq,
  updateFaq,
  toggleFaqStatus,
  deleteFaq,
} from "@/app/actions/faq";
import { FaqPlacement } from "@/app/types/faq";

export function useFaqs(placement?: FaqPlacement) {
  return useQuery({
    queryKey: ["admin-faqs", placement],
    queryFn: () => fetchFaqs(placement),
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<{ placement: FaqPlacement; question: string; answer: string }> }) => 
      updateFaq(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
  });
}

export function useToggleFaqStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleFaqStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
    },
  });
}
