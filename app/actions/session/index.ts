import api from "@/app/lib/axios";
import { AppliedCoupon } from "@/app/types/coupon";
import {
  CreateSessionResponse,
  GenerateResponse,
  PhotoConfirmResponse,
  PhotoUploadUrlResponse,
  RegenerateResponse,
  SessionSnapshot,
  CheckoutResponse,
  SendToPrintSelection,
  SendToPrintResponse,
} from "@/app/types/session";

export async function createSession(comicId: string): Promise<CreateSessionResponse> {
  const { data } = await api.post<CreateSessionResponse>("/api/public/sessions", { comicId });
  return data;
}

export async function updateSession(
  sessionId: string,
  payload: {
    childName?: string;
    age?: number;
    pronounKey?: string;
    notificationEmail?: string;
    coverType?: "HARDCOVER" | "SOFTCOVER";
    shippingName?: string;
    shippingLine1?: string;
    shippingLine2?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingZip?: string;
    shippingCountry?: string;
    shippingPhone?: string;
  }
): Promise<SessionSnapshot> {
  const { data } = await api.patch<SessionSnapshot>(`/api/public/sessions/${sessionId}`, payload);
  return data;
}

export async function getSession(sessionId: string): Promise<SessionSnapshot> {
  const { data } = await api.get<SessionSnapshot>(`/api/public/sessions/${sessionId}`);
  return data;
}

export async function getPhotoUploadUrl(sessionId: string, fileExtension: string): Promise<PhotoUploadUrlResponse> {
  const { data } = await api.post<PhotoUploadUrlResponse>(`/api/public/sessions/${sessionId}/photo/upload-url`, { fileExtension });
  return data;
}

export async function confirmPhoto(sessionId: string, key: string): Promise<SessionSnapshot> {
  const { data } = await api.post<PhotoConfirmResponse>(`/api/public/sessions/${sessionId}/photo/confirm`, { key });
  // The API returns { success: true, data: { session: { ... } } }
  // Axios unwraps to { session: { ... } }
  return data.session;
}

export async function triggerGeneration(sessionId: string): Promise<GenerateResponse> {
  const { data } = await api.post<GenerateResponse>(`/api/public/sessions/${sessionId}/generate`);
  return data;
}

export async function regeneratePage(sessionId: string, pageNumber: number): Promise<RegenerateResponse> {
  const { data } = await api.post<RegenerateResponse>(`/api/public/sessions/${sessionId}/pages/${pageNumber}/regenerate`);
  return data;
}

export async function attachUser(sessionId: string): Promise<void> {
  await api.patch(`/api/public/sessions/${sessionId}/attach-user`);
}

// couponCode: undefined keeps the order as it is (no body, exactly as before),
// a code applies or replaces its coupon, null removes it.
export async function initiateCheckout(
  sessionId: string,
  couponCode?: string | null
): Promise<CheckoutResponse> {
  const { data } = await api.post<CheckoutResponse>(
    `/api/public/sessions/${sessionId}/checkout`,
    couponCode === undefined ? undefined : { couponCode }
  );
  return data;
}

// What would I pay with this code? Read-only; needs the logged-in owner of the session.
export async function previewCoupon(sessionId: string, code: string): Promise<AppliedCoupon> {
  const { data } = await api.post<AppliedCoupon>(
    `/api/public/sessions/${sessionId}/coupon-preview`,
    { code }
  );
  return data;
}

// Unlike everything else in this file, this one lives under /api/user — it needs
// the logged-in user for the ownership check, so an expired cookie 401s here.
export async function sendToPrint(
  sessionId: string,
  selections: SendToPrintSelection[]
): Promise<SendToPrintResponse> {
  const { data } = await api.post<SendToPrintResponse>(
    `/api/user/sessions/${sessionId}/send-to-print`,
    { selections }
  );
  return data;
}
