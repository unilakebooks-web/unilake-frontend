import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSample,
  discardSample,
  fetchSamples,
} from "@/app/actions/sample";

export function useSamples() {
  return useQuery({
    queryKey: ["samples"],
    queryFn: fetchSamples,
    // A sample ends by itself after hours: keep the list from showing an ended one as open.
    refetchInterval: 60_000,
  });
}

export function useCreateSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSample,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
    },
  });
}

export function useDiscardSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: discardSample,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["samples"] });
    },
  });
}
