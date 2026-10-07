export type ContactEnquiryStatus = "OPEN" | "VIEWED" | "RESOLVED" | "DISMISSED";

/**
 * A /contact form submission. Distinct from Feedback: feedback is an anonymous
 * book suggestion with no reply channel by design, whereas an enquiry carries
 * email and phone precisely because it is expected to be answered.
 */
export interface ContactEnquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: ContactEnquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitContactEnquiryPayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}
