import api from "@/app/lib/axios";
import type {
  Comic,
  ComicListItem,
  ComicDetail,
  CreateComicPayload,
  ThumbnailUploadResponse,
  UploadUrlResponse,
  PricingRuleWithCountry,
  ComicStatus,
  PublicComicListItem,
  PublicComicDetail
} from "@/app/types/comic";
import { buildComicFilterParams, type ComicTagFilters } from "@/lib/comicTags";

export async function fetchComics(filters?: ComicTagFilters): Promise<ComicListItem[]> {
  const params = buildComicFilterParams(filters);

  const { data } = await api.get<ComicListItem[]>(`/api/admin/comics?${params.toString()}`);
  return data;
}

export async function fetchComic(id: string): Promise<ComicDetail> {
  const { data } = await api.get<ComicDetail>(`/api/admin/comics/${id}`);
  return data;
}

export async function createComic(payload: CreateComicPayload): Promise<Comic> {
  const { data } = await api.post<Comic>("/api/admin/comics", payload);
  return data;
}

// `thumbnailKeys`, `videoKey` and `themeIds` are REQUEST-only fields — none
// exists on the Comic response (the backend returns `coverThumbnailUrls`,
// `previewVideoUrl` and `themes`), so Partial<Comic> alone will not admit them.
// `themeIds`, when sent, replaces the comic's whole theme set.
export async function updateComic(
  id: string,
  payload: Partial<Comic> & {
    thumbnailKeys?: string[];
    videoKey?: string | null;
    themeIds?: string[];
  }
): Promise<Comic> {
  const { data } = await api.patch<Comic>(`/api/admin/comics/${id}`, payload);
  return data;
}

export async function deleteComic(id: string): Promise<void> {
  await api.delete(`/api/admin/comics/${id}`);
}

export async function updateComicStatus(id: string, status: ComicStatus): Promise<Comic> {
  const { data } = await api.patch<Comic>(`/api/admin/comics/${id}/status`, { status });
  return data;
}

export async function getThumbnailUploadUrls(files: { fileName: string, contentType: string }[]): Promise<ThumbnailUploadResponse> {
  const { data } = await api.post<ThumbnailUploadResponse>("/api/admin/comics/thumbnails/upload-urls", { files });
  return data;
}

export async function setThumbnails(comicId: string, desired: string[]): Promise<Comic> {
  if (desired.length === 0) {
    throw new Error("A comic must keep at least one thumbnail");
  }
  if (desired.length > 10) {
    throw new Error("Maximum 10 thumbnails per comic");
  }
  return updateComic(comicId, { thumbnailKeys: desired });
}

export async function getComicVideoUploadUrl(
  fileName: string,
  contentType: string
): Promise<UploadUrlResponse> {
  const { data } = await api.post<UploadUrlResponse>(
    "/api/admin/comics/video/upload-url",
    { fileName, contentType }
  );
  return data;
}

/**
 * Sets or clears the comic's carousel promo video.
 *
 * Pass a freshly-uploaded R2 key to set/replace it, or null to remove it —
 * the backend deletes the previous file from R2 in both cases. Omitting the
 * field entirely (i.e. not calling this) leaves the video untouched.
 */
export async function setComicVideo(
  comicId: string,
  videoKey: string | null
): Promise<Comic> {
  return updateComic(comicId, { videoKey });
}

export async function fetchPricing(id: string): Promise<PricingRuleWithCountry[]> {
  const { data } = await api.get<PricingRuleWithCountry[]>(`/api/admin/comics/${id}/pricing`);
  return data;
}

export async function updatePricing(id: string, pricing: { countryId: string; coverType: string; mrp: number; price: number }[]): Promise<Comic> {
  const { data } = await api.put<Comic>(`/api/admin/comics/${id}/pricing`, { pricing });
  return data;
}

export async function fetchPublicComics(
  filters?: ComicTagFilters
): Promise<PublicComicListItem[]> {
  const query = buildComicFilterParams(filters).toString();
  const { data } = await api.get<PublicComicListItem[]>(
    `/api/public/comics${query ? `?${query}` : ""}`
  );
  return data;
}

export async function fetchPublicComic(comicId: string): Promise<PublicComicDetail> {
  const { data } = await api.get<PublicComicDetail>(`/api/public/comics/${comicId}`);
  return data;
}

