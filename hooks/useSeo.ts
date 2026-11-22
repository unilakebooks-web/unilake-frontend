import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateComicSeo,
  fetchPageSeos,
  savePageSeo,
  updateHeroImageAlt,
} from "@/app/actions/seo";
import type { UpdateComicSeoPayload } from "@/app/types/comic";
import type { PageSeoPayload, PageSeoSlug } from "@/app/types/seo";

export function useUpdateComicSeo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateComicSeoPayload }) =>
      updateComicSeo(id, data),
    // Same keys as useUpdateComic: the list shows the slug, the detail feeds every card.
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comics"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.id] });
    },
  });
}

export function useUpdateHeroImageAlt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageAlt }: { id: string; imageAlt: string | null }) =>
      updateHeroImageAlt(id, imageAlt),
    // The hero screen keeps its list in local state and swaps in the returned row; this covers any cached reader.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-images"] });
    },
  });
}

export function usePageSeos() {
  return useQuery({
    queryKey: ["admin-page-seo"],
    queryFn: fetchPageSeos,
  });
}

export function useSavePageSeo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, payload }: { slug: PageSeoSlug; payload: PageSeoPayload }) =>
      savePageSeo(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-seo"] });
    },
  });
}
