import api from "@/app/lib/axios";
import type { Comic, UpdateComicSeoPayload } from "@/app/types/comic";
import type { HeroImage } from "@/app/types/heroimage";
import type { BlogUploadUrlResponse } from "@/app/types/blog";
import type { PageSeo, PageSeoPayload, PageSeoSlug } from "@/app/types/seo";

/**
 * Saves a comic's address, share preview and cover alt text. A changed slug keeps the old address working
 * (the backend records it and the public site redirects). A slug another comic already uses is a 409 whose
 * message the caller shows as it is.
 */
export async function updateComicSeo(
  id: string,
  payload: UpdateComicSeoPayload
): Promise<Comic> {
  const { data } = await api.patch<Comic>(`/api/admin/comics/${id}`, payload);
  return data;
}

export async function requestComicOgImageUploadUrl(
  fileName: string,
  contentType: string
): Promise<BlogUploadUrlResponse> {
  const { data } = await api.post<BlogUploadUrlResponse>(
    "/api/admin/comics/og-image/upload-url",
    { fileName, contentType }
  );
  return data;
}

/** Edits the alt text of an existing hero banner. Null or an empty string clears it. */
export async function updateHeroImageAlt(
  id: string,
  imageAlt: string | null
): Promise<HeroImage> {
  const { data } = await api.patch<HeroImage>(`/api/admin/hero-images/${id}`, {
    imageAlt,
  });
  return data;
}

/** Always returns all ten pages; one never saved comes back as a placeholder with `id: null`. */
export async function fetchPageSeos(): Promise<PageSeo[]> {
  const { data } = await api.get<PageSeo[]>("/api/admin/page-seo");
  return data;
}

/** Create-or-update. A null or empty string clears a field. */
export async function savePageSeo(
  slug: PageSeoSlug,
  payload: PageSeoPayload
): Promise<PageSeo> {
  const { data } = await api.put<PageSeo>(`/api/admin/page-seo/${slug}`, payload);
  return data;
}

export async function requestPageSeoUploadUrl(
  fileName: string,
  contentType: string
): Promise<BlogUploadUrlResponse> {
  const { data } = await api.post<BlogUploadUrlResponse>(
    "/api/admin/page-seo/upload-url",
    { fileName, contentType }
  );
  return data;
}
