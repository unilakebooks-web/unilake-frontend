import api from "@/app/lib/axios";
import type { Theme } from "@/app/types/theme";

export async function fetchThemes(): Promise<Theme[]> {
  const { data } = await api.get<Theme[]>("/api/public/themes");
  return data;
}

export async function createTheme(name: string): Promise<Theme> {
  const { data } = await api.post<Theme>("/api/admin/themes", { name });
  return data;
}

export async function updateTheme(id: string, name: string): Promise<Theme> {
  const { data } = await api.patch<Theme>(`/api/admin/themes/${id}`, { name });
  return data;
}

export async function deleteTheme(id: string): Promise<void> {
  await api.delete(`/api/admin/themes/${id}`);
}
