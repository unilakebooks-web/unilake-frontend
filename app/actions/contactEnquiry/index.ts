import api from "@/app/lib/axios";
import type {
  ContactEnquiry,
  ContactEnquiryStatus,
} from "@/app/types/contactEnquiry";

export async function fetchContactEnquiries(
  status?: ContactEnquiryStatus
): Promise<ContactEnquiry[]> {
  const url = status
    ? `/api/admin/contact-enquiries?status=${status}`
    : "/api/admin/contact-enquiries";
  const { data } = await api.get<ContactEnquiry[]>(url);
  return data;
}

export async function updateContactEnquiryStatus(
  id: string,
  status: ContactEnquiryStatus
): Promise<ContactEnquiry> {
  const { data } = await api.patch<ContactEnquiry>(
    `/api/admin/contact-enquiries/${id}/status`,
    { status }
  );
  return data;
}

export async function deleteContactEnquiry(id: string): Promise<void> {
  await api.delete(`/api/admin/contact-enquiries/${id}`);
}
