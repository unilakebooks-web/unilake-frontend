import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchContactEnquiries,
  updateContactEnquiryStatus,
  deleteContactEnquiry,
} from "@/app/actions/contactEnquiry";
import { ContactEnquiryStatus } from "@/app/types/contactEnquiry";

// Query keys are namespaced away from the feedback ones so the two admin
// inboxes can never collide in the cache.

export function useContactEnquiries(status?: ContactEnquiryStatus) {
  return useQuery({
    queryKey: ["admin-contact-enquiries", status],
    queryFn: () => fetchContactEnquiries(status),
  });
}

export function useUpdateContactEnquiryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactEnquiryStatus }) =>
      updateContactEnquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-enquiries"] });
    },
  });
}

export function useDeleteContactEnquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContactEnquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-enquiries"] });
    },
  });
}
