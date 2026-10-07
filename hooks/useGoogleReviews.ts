import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createGoogleReview,
  deleteGoogleReview,
  fetchGoogleReviews,
  toggleGoogleReviewStatus,
  updateGoogleReview,
} from "@/app/actions/googleReview";
import type { UpdateGoogleReviewPayload } from "@/app/types/googleReview";

const ADMIN_KEY = ["admin-google-reviews"];

export function useGoogleReviews() {
  return useQuery({
    queryKey: ADMIN_KEY,
    queryFn: fetchGoogleReviews,
  });
}

/**
 * Every mutation also invalidates the public list, so an admin previewing the
 * homepage in another tab sees their change without a hard reload.
 */
function useInvalidateReviews() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ADMIN_KEY });
    queryClient.invalidateQueries({ queryKey: ["public-google-reviews"] });
  };
}

export function useCreateGoogleReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: createGoogleReview,
    onSuccess: invalidate,
  });
}

export function useUpdateGoogleReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateGoogleReviewPayload;
    }) => updateGoogleReview(id, payload),
    onSuccess: invalidate,
  });
}

export function useToggleGoogleReviewStatus() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: toggleGoogleReviewStatus,
    onSuccess: invalidate,
  });
}

export function useDeleteGoogleReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: deleteGoogleReview,
    onSuccess: invalidate,
  });
}
