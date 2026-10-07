import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchThemes,
  createTheme,
  updateTheme,
  deleteTheme,
} from "@/app/actions/theme";
import type { Theme } from "@/app/types/theme";

export function useThemes() {
  return useQuery({
    queryKey: ["themes"],
    queryFn: fetchThemes,
  });
}

export function useCreateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
    },
  });
}

export function useUpdateTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateTheme(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
    },
  });
}

export function useDeleteTheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTheme,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
    },
  });
}
