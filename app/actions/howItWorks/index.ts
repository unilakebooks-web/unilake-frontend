import api from "@/app/lib/axios";
import type { HowItWorks, HowItWorksUploadUrlResponse } from "@/app/types/howItWorks";

export async function fetchHowItWorks(): Promise<HowItWorks | null> {
  const { data } = await api.get<HowItWorks | null>("/api/admin/how-it-works");
  return data;
}

export async function requestHowItWorksUploadUrl(
  assetType: "video" | "poster",
  fileName: string,
  contentType: string
): Promise<HowItWorksUploadUrlResponse> {
  const { data } = await api.post<HowItWorksUploadUrlResponse>("/api/admin/how-it-works/upload-url", {
    assetType,
    fileName,
    contentType,
  });
  return data;
}

export async function saveHowItWorks(payload: Record<string, unknown>): Promise<HowItWorks> {
  const { data } = await api.patch<HowItWorks>("/api/admin/how-it-works", payload);
  return data;
}
