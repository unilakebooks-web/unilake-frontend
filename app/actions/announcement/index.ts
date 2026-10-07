import api from "@/app/lib/axios";
import type { Announcement } from "@/app/types/announcement";

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data } = await api.get<Announcement[]>("/api/admin/announcements");
  return data;
}

export async function createAnnouncement(message: string): Promise<Announcement> {
  const { data } = await api.post<Announcement>("/api/admin/announcements", { message });
  return data;
}

export async function updateAnnouncement(id: string, message: string): Promise<Announcement> {
  const { data } = await api.patch<Announcement>(`/api/admin/announcements/${id}`, { message });
  return data;
}

export async function toggleAnnouncementStatus(id: string): Promise<Announcement> {
  const { data } = await api.patch<Announcement>(`/api/admin/announcements/${id}/status`);
  return data;
}

export async function reorderAnnouncements(orderedIds: string[]): Promise<Announcement[]> {
  const { data } = await api.patch<Announcement[]>("/api/admin/announcements/reorder", { orderedIds });
  return data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await api.delete(`/api/admin/announcements/${id}`);
}

export async function fetchPublicAnnouncements(): Promise<Announcement[]> {
  try {
    const { data } = await api.get<Announcement[]>("/api/public/announcements");
    return data || [];
  } catch {
    return [];
  }
}

