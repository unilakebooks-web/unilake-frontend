import { useQuery } from "@tanstack/react-query";
import { fetchPublicComics, fetchPublicComic } from "@/app/actions/comic";
import { fetchThemes } from "@/app/actions/theme";
import { normalizeComicFilters, type ComicTagFilters } from "@/lib/comicTags";

export function usePublicComics(filters?: ComicTagFilters) {
  return useQuery({
    queryKey: ["public-comics", normalizeComicFilters(filters)],
    queryFn: () => fetchPublicComics(filters),
  });
}

export function usePublicComic(comicId: string) {
  return useQuery({
    queryKey: ["public-comic", comicId],
    queryFn: () => fetchPublicComic(comicId),
    enabled: !!comicId,
  });
}

export function useLatestPublicComics(excludeComicId?: string, count = 4) {
  const query = useQuery({
    queryKey: ["public-comics-latest"],
    queryFn: () => fetchPublicComics(),  // no filters → all published comics
  });

  // Derive: exclude current comic, take the first `count`. The API already
  // orders bestsellers first, then newest — so despite the hook's name these
  // are the top picks, not strictly the latest.
  const comics = query.data
    ?.filter((c) => c.id !== excludeComicId)
    .slice(0, count) ?? [];

  return { ...query, data: comics };
}

export function usePublicThemes() {
  return useQuery({
    queryKey: ["public-themes"],
    queryFn: () => fetchThemes(),
  });
}

import { fetchPublicCountries } from "@/app/actions/country";

export function usePublicCountries() {
  return useQuery({
    queryKey: ["public-countries"],
    queryFn: fetchPublicCountries,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
