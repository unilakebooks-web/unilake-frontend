import api from "@/app/lib/axios";
import type { Bubble, BubbleWithFont } from "@/app/types/comic";

export async function fetchBubbles(pageId: string): Promise<BubbleWithFont[]> {
  const { data } = await api.get<BubbleWithFont[]>(`/api/admin/pages/${pageId}/bubbles`);
  return data;
}

export async function createBubble(pageId: string, payload: Partial<Bubble> & { x: number, y: number, width: number, height: number, dialogue: string}): Promise<Bubble> {
  const { data } = await api.post<Bubble>(`/api/admin/pages/${pageId}/bubbles`, payload);
  return data;
}

export async function updateBubble(bubbleId: string, payload: Partial<Bubble>): Promise<BubbleWithFont> {
  const { data } = await api.patch<BubbleWithFont>(`/api/admin/bubbles/${bubbleId}`, payload);
  return data;
}

export async function deleteBubble(bubbleId: string): Promise<void> {
  await api.delete(`/api/admin/bubbles/${bubbleId}`);
}
