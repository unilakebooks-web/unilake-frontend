import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBubbles, createBubble, updateBubble, deleteBubble } from "@/app/actions/bubble";
import type { Bubble } from "@/app/types/comic";

export function useBubbles(pageId: string, comicId: string) {
  return useQuery({
    queryKey: ["comic", comicId, "page", pageId, "bubbles"],
    queryFn: () => fetchBubbles(pageId),
    enabled: !!pageId && !!comicId,
  });
}

export function useCreateBubble() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, data, comicId }: { pageId: string; data: Partial<Bubble> & { x: number, y: number, width: number, height: number, dialogue: string }; comicId: string }) =>
      createBubble(pageId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "page", variables.pageId, "bubbles"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] }); // Nested bubbles count
    },
  });
}

export function useUpdateBubble() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bubbleId, data, comicId, pageId }: { bubbleId: string; data: Partial<Bubble>; comicId: string; pageId: string }) =>
      updateBubble(bubbleId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "page", variables.pageId, "bubbles"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
    },
  });
}

export function useDeleteBubble() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bubbleId, comicId, pageId }: { bubbleId: string; comicId: string; pageId: string }) => deleteBubble(bubbleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "page", variables.pageId, "bubbles"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
    },
  });
}
