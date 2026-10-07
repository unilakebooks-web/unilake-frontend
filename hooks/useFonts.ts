import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFonts, createFont, updateFont, deleteFont } from "@/app/actions/font";
import { fontFileQueryKey } from "@/hooks/useFontFiles";

export function useFonts(comicId: string) {
  return useQuery({
    queryKey: ["comic", comicId, "fonts"],
    queryFn: () => fetchFonts(comicId),
    enabled: !!comicId,
  });
}

export function useCreateFont() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comicId, data }: { comicId: string; data: { name: string; fontKey: string } }) =>
      createFont(comicId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "fonts"] });
    },
  });
}

export function useUpdateFont() {
  const queryClient = useQueryClient();
  return useMutation({
    // Needs comicId for cache invalidation even though API doesn't need it
    mutationFn: ({ fontId, data }: { fontId: string; data: { name?: string; fontKey?: string }; comicId: string }) =>
      updateFont(fontId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "fonts"] });
      // Might affect pages if a bubble references this font
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pages"] });
      // A replaced file must not keep drawing from the old parsed font.
      queryClient.removeQueries({ queryKey: fontFileQueryKey(variables.fontId) });
    },
  });
}

export function useDeleteFont() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fontId, comicId }: { fontId: string; comicId: string }) => deleteFont(fontId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "fonts"] });
      queryClient.removeQueries({ queryKey: fontFileQueryKey(variables.fontId) });
    },
  });
}
