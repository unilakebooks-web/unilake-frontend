import api from "@/app/lib/axios";
import type { HeroImage, UploadUrlResponse } from "@/app/types/heroimage";

/**
 * Fetches all hero slide images for the admin console (sorted newest first)
 */
export async function fetchHeroImages(): Promise<HeroImage[]> {
  const { data } = await api.get<HeroImage[]>("/api/admin/hero-images");
  return data;
}

/**
 * Step 1 of upload: requests a short-lived presigned R2 upload URL and key
 */
export async function requestUploadUrl(
  fileName: string,
  contentType: string
): Promise<UploadUrlResponse> {
  const { data } = await api.post<UploadUrlResponse>("/api/admin/hero-images/upload-url", {
    fileName,
    contentType,
  });
  return data;
}

/**
 * Step 3 of upload: registers the R2 object key in Postgres after PUT succeeds
 */
export async function createHeroImage(imageKey: string): Promise<HeroImage> {
  const { data } = await api.post<HeroImage>("/api/admin/hero-images", { imageKey });
  return data;
}

/**
 * Blindly flips the isActive status of a hero image slide
 */
export async function toggleHeroImageStatus(id: string): Promise<HeroImage> {
  const { data } = await api.patch<HeroImage>(`/api/admin/hero-images/${id}/status`);
  return data;
}

/**
 * Hard deletes a hero image slide DB record (returns 204 No Content)
 */
export async function deleteHeroImage(id: string): Promise<void> {
  await api.delete(`/api/admin/hero-images/${id}`);
}

/**
 * Fetches only active hero slide images for the public homepage.
 * Uses a bare fetch because it does not require admin authentication.
 */
export async function getPublicHeroImages(): Promise<HeroImage[]> {
  const baseURL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${baseURL}/api/public/hero-images`, {
      cache: "no-store", // Always fetch the latest active images
    });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (err: any) {
    if (err?.cause?.code !== "ECONNREFUSED" && err?.code !== "ECONNREFUSED") {
      console.error("Error fetching public hero images:", err);
    }
    return [];
  }
}
