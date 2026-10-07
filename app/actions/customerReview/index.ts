import api from "@/app/lib/axios";
import type { CustomerReview, UploadUrlResponse } from "@/app/types/customerReview";

export async function fetchCustomerReviews(): Promise<CustomerReview[]> {
  const { data } = await api.get<CustomerReview[]>("/api/admin/customer-reviews");
  return data;
}

export async function requestVideoUploadUrl(
  fileName: string,
  contentType: string
): Promise<UploadUrlResponse> {
  const { data } = await api.post<UploadUrlResponse>("/api/admin/customer-reviews/upload-url", {
    fileName,
    contentType,
  });
  return data;
}

export async function createCustomerReview(payload: {
  customerName: string;
  description: string;
  videoKey: string;
}): Promise<CustomerReview> {
  const { data } = await api.post<CustomerReview>("/api/admin/customer-reviews", payload);
  return data;
}

export async function toggleCustomerReviewStatus(id: string): Promise<CustomerReview> {
  const { data } = await api.patch<CustomerReview>(`/api/admin/customer-reviews/${id}/status`);
  return data;
}

export async function deleteCustomerReview(id: string): Promise<void> {
  await api.delete(`/api/admin/customer-reviews/${id}`);
}
