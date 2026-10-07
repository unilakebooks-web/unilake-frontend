import api from "@/app/lib/axios";
import type { Faq, FaqPlacement } from "@/app/types/faq";

export async function fetchFaqs(placement?: FaqPlacement): Promise<Faq[]> {
  const url = placement ? `/api/admin/faqs?placement=${placement}` : "/api/admin/faqs";
  const { data } = await api.get<Faq[]>(url);
  return data;
}

export async function createFaq(payload: {
  placement: FaqPlacement;
  question: string;
  answer: string;
}): Promise<Faq> {
  const { data } = await api.post<Faq>("/api/admin/faqs", payload);
  return data;
}

export async function updateFaq(
  id: string,
  payload: Partial<{ placement: FaqPlacement; question: string; answer: string }>
): Promise<Faq> {
  const { data } = await api.patch<Faq>(`/api/admin/faqs/${id}`, payload);
  return data;
}

export async function toggleFaqStatus(id: string): Promise<Faq> {
  const { data } = await api.patch<Faq>(`/api/admin/faqs/${id}/status`);
  return data;
}

export async function reorderFaqs(orderedIds: string[]): Promise<Faq[]> {
  const { data } = await api.patch<Faq[]>("/api/admin/faqs/reorder", { orderedIds });
  return data;
}

export async function deleteFaq(id: string): Promise<void> {
  await api.delete(`/api/admin/faqs/${id}`);
}
