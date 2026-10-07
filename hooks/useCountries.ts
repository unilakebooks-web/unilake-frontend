import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCountries,
  createCountry,
  updateCountry,
  deleteCountry,
} from "@/app/actions/country";
import type { Country } from "@/app/types/country";

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });
}

export function useCreateCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
}

export function useUpdateCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ code: string; name: string; currencyCode: string; flagKey: string }> }) =>
      updateCountry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });
    },
  });
}

export function useDeleteCountry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] });

      // Deleting a country cascades its pricing rules away, so anything
      // holding pricing is now stale: the comics list renders
      // _count.pricingRules per comic, and each comic detail carries its own
      // pricingRules array plus a ["comic", id, "pricing"] child query.
      // ["comic"] with no id matches all of them by key prefix.
      queryClient.invalidateQueries({ queryKey: ["comics"] });
      queryClient.invalidateQueries({ queryKey: ["comic"] });
    },
  });
}
