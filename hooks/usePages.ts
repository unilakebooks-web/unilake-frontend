import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPages, createPage, updatePage, deletePage, reorderPages, previewPageStamp } from "@/app/actions/page";
import type { Page, PreviewStampRequest } from "@/app/types/comic";

export function usePages(comicId: string) {
  return useQuery({
    queryKey: ["comic", comicId, "pages"],
    queryFn: () => fetchPages(comicId),
    enabled: !!comicId,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comicId, data }: { comicId: string; data: Partial<Page> & { pageNumber: number } }) =>
      createPage(comicId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] }); // Update page count in summary
      queryClient.invalidateQueries({ queryKey: ["comics"] }); // Update list
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, data, comicId }: { pageId: string; data: Partial<Page>; comicId: string }) =>
      updatePage(pageId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, comicId }: { pageId: string; comicId: string }) => deletePage(pageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] });
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    },
  });
}

export function useReorderPages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comicId, orderedPageIds }: { comicId: string; orderedPageIds: string[] }) =>
      reorderPages(comicId, orderedPageIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] });
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    },
  });
}

/**
 * Renders a bubble-mapping preview.
 *
 * A mutation rather than a query on purpose: it POSTs the current bubbles, and
 * it should only fire when the admin asks for it, never on mount or refocus.
 * Nothing is invalidated afterwards because the endpoint changes no state.
 */
export function usePreviewPageStamp() {
  return useMutation({
    mutationFn: ({ pageId, data }: { pageId: string; data: PreviewStampRequest }) =>
      previewPageStamp(pageId, data),
  });
}
