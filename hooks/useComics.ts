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
} from "@/app/actions/comic";
import type { ComicStatus, CreateComicPayload } from "@/app/types/comic";
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
