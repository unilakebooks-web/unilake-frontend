import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomerReviews,
  createCustomerReview,
  toggleCustomerReviewStatus,
  deleteCustomerReview,
} from "@/app/actions/customerReview";

export function useCustomerReviews() {
  return useQuery({
    queryKey: ["admin-customer-reviews"],
    queryFn: fetchCustomerReviews,
  });
}

export function useCreateCustomerReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createCustomerReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer-reviews"] });
    },
  });
}

export function useToggleCustomerReviewStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleCustomerReviewStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer-reviews"] });
    },
  });
}

export function useDeleteCustomerReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCustomerReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customer-reviews"] });
    },
  });
}
