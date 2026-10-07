import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSitePage,
  fetchSitePages,
  saveSitePage,
  toggleSitePageStatus,
} from "@/app/actions/sitePage";
import type { SitePageSlug } from "@/app/types/sitePage";

export function useSitePages() {
  return useQuery({
    queryKey: ["admin-site-pages"],
    queryFn: fetchSitePages,
  });
}

export function useSitePage(slug: SitePageSlug) {
  return useQuery({
    queryKey: ["admin-site-page", slug],
    queryFn: () => fetchSitePage(slug),
    enabled: !!slug,
  });
}

export function useSaveSitePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      payload,
    }: {
      slug: SitePageSlug;
      payload: { title: string; body: string };
    }) => saveSitePage(slug, payload),
    onSuccess: (_, variables) => {
      // The list carries title and updatedAt, so it goes stale on every save.
      queryClient.invalidateQueries({ queryKey: ["admin-site-pages"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-site-page", variables.slug],
      });
    },
  });
}

export function useToggleSitePageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: SitePageSlug) => toggleSitePageStatus(slug),
    onSuccess: (_, slug) => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-pages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-site-page", slug] });
    },
  });
}
