import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPricing, updatePricing } from "@/app/actions/comic";
import type { CoverType } from "@/app/types/comic";

export function usePricing(comicId: string) {
  return useQuery({
    queryKey: ["comic", comicId, "pricing"],
    queryFn: () => fetchPricing(comicId),
    enabled: !!comicId,
  });
}

export function useUpdatePricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comicId, pricing }: { comicId: string; pricing: { countryId: string; coverType: CoverType; mrp: number; price: number }[] }) =>
      updatePricing(comicId, pricing),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId, "pricing"] });
      queryClient.invalidateQueries({ queryKey: ["comic", variables.comicId] });
      queryClient.invalidateQueries({ queryKey: ["comics"] }); // Updates _count.pricingRules
    },
  });
}
