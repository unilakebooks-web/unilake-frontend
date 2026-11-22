export type GoogleReview = {
  id: string;
  customerName: string;
  /** Whole stars, 1–5. */
  rating: number;
  reviewText: string;
  /** Always present - the column is NOT NULL, so cards need no fallback. */
  imageUrl: string;
  /** Description of the photo for screen readers and search; null until the admin writes one. */
  imageAlt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateGoogleReviewPayload = {
  customerName: string;
  rating: number;
  reviewText: string;
  /** R2 key from the upload-url step, resolved to a public URL server-side. */
  imageKey: string;
  /** Optional description of the photo, up to 200 characters. */
  imageAlt?: string | null;
};

/**
 * Every field optional. Note imageKey cannot be null: the column is NOT NULL,
 * so an image can be replaced but never removed. Omit it to keep the current one.
 */
export type UpdateGoogleReviewPayload = Partial<CreateGoogleReviewPayload>;

export type GoogleReviewUploadUrlResponse = {
  uploadUrl: string;
  key: string;
};

export const MIN_RATING = 1;
export const MAX_RATING = 5;
