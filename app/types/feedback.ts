export type FeedbackStatus = "OPEN" | "VIEWED" | "RESOLVED" | "DISMISSED";

export interface Feedback {
  id: string;
  name: string;
  message: string;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
}
