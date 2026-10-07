import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTeamMembers,
  createTeamMember,
  updateTeamMember,
  toggleTeamMemberStatus,
  deleteTeamMember,
} from "@/app/actions/teamMember";
import { CreateTeamMemberPayload, UpdateTeamMemberPayload } from "@/app/types/teamMember";

export function useTeamMembers() {
  return useQuery({
    queryKey: ["admin-team-members"],
    queryFn: fetchTeamMembers,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeamMemberPayload }) => 
      updateTeamMember(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
    },
  });
}

export function useToggleTeamMemberStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleTeamMemberStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
    },
  });
}
