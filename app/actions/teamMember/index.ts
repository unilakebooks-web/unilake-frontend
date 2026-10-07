import api from "@/app/lib/axios";
import type { TeamMember, UploadUrlResponse, CreateTeamMemberPayload, UpdateTeamMemberPayload } from "@/app/types/teamMember";

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data } = await api.get<TeamMember[]>("/api/admin/team-members");
  return data;
}

export async function requestImageUploadUrl(
  fileName: string,
  contentType: string
): Promise<UploadUrlResponse> {
  const { data } = await api.post<UploadUrlResponse>("/api/admin/team-members/upload-url", {
    fileName,
    contentType,
  });
  return data;
}

export async function createTeamMember(payload: CreateTeamMemberPayload): Promise<TeamMember> {
  const { data } = await api.post<TeamMember>("/api/admin/team-members", payload);
  return data;
}

export async function updateTeamMember(id: string, payload: UpdateTeamMemberPayload): Promise<TeamMember> {
  const { data } = await api.patch<TeamMember>(`/api/admin/team-members/${id}`, payload);
  return data;
}

export async function toggleTeamMemberStatus(id: string): Promise<TeamMember> {
  const { data } = await api.patch<TeamMember>(`/api/admin/team-members/${id}/status`);
  return data;
}

export async function deleteTeamMember(id: string): Promise<void> {
  await api.delete(`/api/admin/team-members/${id}`);
}
