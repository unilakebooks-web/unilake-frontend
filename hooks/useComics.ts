import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchComics,
  fetchComic,
  createComic,
  updateComic,
  deleteComic,
  updateComicStatus,
  setThumbnails,
  setComicVideo,
  reorderComics,
} from "@/app/actions/comic";
import type { ComicListItem, ComicStatus, CreateComicPayload } from "@/app/types/comic";
import { normalizeComicFilters, type ComicTagFilters } from "@/lib/comicTags";

export function useComics(filters?: ComicTagFilters) {
  return useQuery({
    queryKey: ["comics", normalizeComicFilters(filters)],
    queryFn: () => fetchComics(filters),
  });
}

export function useComic(id: string) {
  return useQuery({
    queryKey: ["comic", id],
    queryFn: () => fetchComic(id),
    enabled: !!id,
  });
}

export function useCreateComic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    },
  });
}

export function useUpdateComic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateComic>[1] }) =>
      updateComic(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comics"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.id] });
    },
  });
}

export function useDeleteComic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComic,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["comics"] });
      queryClient.removeQueries({ queryKey: ["comic", id] });
    },
  });
}

export function useUpdateComicStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ComicStatus }) =>
      updateComicStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comics"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.id] });
    },
  });
}

export function useSetThumbnails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comicId, desired }: { comicId: string; desired: string[] }) =>
      setThumbnails(comicId, desired),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comics"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] });
    },
  });
}

/** Sets the comic's promo video (key) or removes it (null). */
export function useSetComicVideo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      comicId,
      videoKey,
    }: {
      comicId: string;
      videoKey: string | null;
    }) => setComicVideo(comicId, videoKey),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comics"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] });
    },
  });
}

// The Arrange Books screen needs the list as it is NOW (a book published a minute
// ago must be in it, or the first Save is refused), so it ignores the 30 s cache.
export function useArrangeComics() {
  return useQuery({
    queryKey: ["comics", normalizeComicFilters(undefined)],
    queryFn: () => fetchComics(),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useReorderComics() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderComics,
    // The answer holds the saved numbers: put them in every cached list straight
    // away, so the screen shows the new order at once and a failed refresh cannot
    // bring the old order back. The refetch below then only confirms.
    onSuccess: (saved) => {
      const numbers = new Map(saved.map((s) => [s.id, s.sortOrder]));
      queryClient.setQueriesData<ComicListItem[]>({ queryKey: ["comics"] }, (old) =>
        Array.isArray(old)
          ? old.map((c) => (numbers.has(c.id) ? { ...c, sortOrder: numbers.get(c.id)! } : c))
          : old
      );
      queryClient.invalidateQueries({ queryKey: ["comics"] });
    },
  });
}
