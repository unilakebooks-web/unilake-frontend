import api from "@/app/lib/axios";
import type { Feedback, FeedbackStatus } from "@/app/types/feedback";

export async function fetchFeedbacks(status?: FeedbackStatus): Promise<Feedback[]> {
  const url = status ? `/api/admin/feedbacks?status=${status}` : "/api/admin/feedbacks";
  const { data } = await api.get<Feedback[]>(url);
  return data;
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<Feedback> {
  const { data } = await api.patch<Feedback>(`/api/admin/feedbacks/${id}/status`, { status });
  return data;
}

export async function deleteFeedback(id: string): Promise<void> {
  await api.delete(`/api/admin/feedbacks/${id}`);
}
