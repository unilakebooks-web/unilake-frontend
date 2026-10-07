import api from "@/app/lib/axios";
import type {
  CreateGoogleReviewPayload,
  GoogleReview,
  GoogleReviewUploadUrlResponse,
  UpdateGoogleReviewPayload,
} from "@/app/types/googleReview";

export async function fetchGoogleReviews(): Promise<GoogleReview[]> {
  const { data } = await api.get<GoogleReview[]>("/api/admin/google-reviews");
  return data;
}

export async function requestGoogleReviewUploadUrl(
  fileName: string,
  contentType: string
): Promise<GoogleReviewUploadUrlResponse> {
  const { data } = await api.post<GoogleReviewUploadUrlResponse>(
    "/api/admin/google-reviews/upload-url",
    { fileName, contentType }
  );
  return data;
}

export async function createGoogleReview(
  payload: CreateGoogleReviewPayload
): Promise<GoogleReview> {
  const { data } = await api.post<GoogleReview>(
    "/api/admin/google-reviews",
    payload
  );
  return data;
}

export async function updateGoogleReview(
  id: string,
  payload: UpdateGoogleReviewPayload
): Promise<GoogleReview> {
  const { data } = await api.patch<GoogleReview>(
    `/api/admin/google-reviews/${id}`,
    payload
  );
  return data;
}

export async function toggleGoogleReviewStatus(
  id: string
): Promise<GoogleReview> {
  const { data } = await api.patch<GoogleReview>(
    `/api/admin/google-reviews/${id}/status`
  );
  return data;
}

export async function deleteGoogleReview(id: string): Promise<void> {
  await api.delete(`/api/admin/google-reviews/${id}`);
}
