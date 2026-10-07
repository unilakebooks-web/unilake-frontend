export interface Announcement {
  id: string;
  message: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type { ApiSuccessResponse, ApiErrorResponse, ApiResponse } from "./api";

