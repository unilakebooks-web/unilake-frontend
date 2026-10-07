import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchComicFacts,
  createComicFact,
  updateComicFact,
  toggleComicFactStatus,
  deleteComicFact,
} from "@/app/actions/comicFact";
import type { ComicFactPlacement } from "@/app/types/comic";

/**
 * Both lists are fetched together and filtered in the component, mirroring how
 * the admin FAQ screen works: switching between the two tabs then costs no
 * network request, and moving a fact from one list to the other updates both
 * from a single invalidation.
 */
const factsKey = (comicId: string) => ["comic-facts", comicId] as const;

export function useComicFacts(comicId: string) {
  return useQuery({
    queryKey: factsKey(comicId),
    queryFn: () => fetchComicFacts(comicId),
    enabled: !!comicId,
  });
}

export function useCreateComicFact(comicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { placement: ComicFactPlacement; text: string }) =>
      createComicFact(comicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factsKey(comicId) });
    },
  });
}

export function useUpdateComicFact(comicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      factId,
      payload,
    }: {
      factId: string;
      payload: { placement?: ComicFactPlacement; text?: string };
    }) => updateComicFact(factId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factsKey(comicId) });
    },
  });
}

export function useToggleComicFactStatus(comicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (factId: string) => toggleComicFactStatus(factId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factsKey(comicId) });
    },
  });
}

export function useDeleteComicFact(comicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (factId: string) => deleteComicFact(factId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factsKey(comicId) });
    },
  });
}
