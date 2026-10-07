export interface CustomerReview {
  id: string;
  customerName: string;
  description: string;
  videoUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
}
