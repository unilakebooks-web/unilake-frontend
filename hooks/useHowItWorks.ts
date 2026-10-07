import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchHowItWorks, saveHowItWorks } from "@/app/actions/howItWorks";

export function useHowItWorks() {
  return useQuery({
    queryKey: ["admin-how-it-works"],
    queryFn: fetchHowItWorks,
  });
}

export function useSaveHowItWorks() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: saveHowItWorks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-how-it-works"] });
    },
  });
}
