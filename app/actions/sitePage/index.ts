import api from "@/app/lib/axios";
import type { SitePage, SitePageSlug } from "@/app/types/sitePage";

/**
 * Always returns exactly three entries — one per slug — whether or not the
 * admin has saved them. Unsaved pages come back as placeholders with id: null.
 */
export async function fetchSitePages(): Promise<SitePage[]> {
  const { data } = await api.get<SitePage[]>("/api/admin/site-pages");
  return data;
}

/** Never 404s: an unsaved page returns a placeholder so the editor can open it. */
export async function fetchSitePage(slug: SitePageSlug): Promise<SitePage> {
  const { data } = await api.get<SitePage>(`/api/admin/site-pages/${slug}`);
  return data;
}

/**
 * Create-or-update. Deliberately cannot change isActive — publishing is the
 * status endpoint's job, so saving a draft can never accidentally make it live.
 */
export async function saveSitePage(
  slug: SitePageSlug,
  payload: { title: string; body: string }
): Promise<SitePage> {
  const { data } = await api.put<SitePage>(
    `/api/admin/site-pages/${slug}`,
    payload
  );
  return data;
}

/**
 * Publish / unpublish. Returns 409 if the page has never been saved — callers
 * should keep the control disabled until `id` is non-null rather than relying
 * on the error.
 */
export async function toggleSitePageStatus(
  slug: SitePageSlug
): Promise<SitePage> {
  const { data } = await api.patch<SitePage>(
    `/api/admin/site-pages/${slug}/status`
  );
  return data;
}
