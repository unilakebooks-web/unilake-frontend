export interface HeroImage {
  id: string;
  imageUrl: string;
  imageAlt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
}
