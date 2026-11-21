import api from "@/app/lib/axios";
import type {
  AudienceCounts,
  Broadcast,
  BroadcastDetail,
  BroadcastPayload,
  BroadcastPreview,
  BroadcastTestResult,
  MarketingConsent,
  ReminderSettings,
  ReminderStatus,
  UnsubscribeInfo,
  UnsubscribeScope,
  UpdateReminderSettingsPayload,
} from "@/app/types/email";

// Admin: reminders
export async function fetchReminderSettings(): Promise<ReminderSettings> {
  const { data } = await api.get<ReminderSettings>(
    "/api/admin/reminders/settings",
  );
  return data;
}

export async function saveReminderSettings(
  payload: UpdateReminderSettingsPayload,
): Promise<ReminderSettings> {
  const { data } = await api.patch<ReminderSettings>(
    "/api/admin/reminders/settings",
    payload,
  );
  return data;
}

export async function fetchReminderStatus(): Promise<ReminderStatus> {
  const { data } = await api.get<ReminderStatus>("/api/admin/reminders/status");
  return data;
}

// Admin: broadcast
export async function fetchBroadcasts(): Promise<Broadcast[]> {
  const { data } = await api.get<Broadcast[]>("/api/admin/broadcasts");
  return data;
}

export async function fetchAudienceCounts(): Promise<AudienceCounts> {
  const { data } = await api.get<AudienceCounts>(
    "/api/admin/broadcasts/audience",
  );
  return data;
}

export async function fetchBroadcast(id: string): Promise<BroadcastDetail> {
  const { data } = await api.get<BroadcastDetail>(
    `/api/admin/broadcasts/${id}`,
  );
  return data;
}

export async function createBroadcast(
  payload: BroadcastPayload,
): Promise<Broadcast> {
  const { data } = await api.post<Broadcast>("/api/admin/broadcasts", payload);
  return data;
}

export async function updateBroadcast(
  id: string,
  payload: Partial<BroadcastPayload>,
): Promise<Broadcast> {
  const { data } = await api.patch<Broadcast>(
    `/api/admin/broadcasts/${id}`,
    payload,
  );
  return data;
}

export async function deleteBroadcast(id: string): Promise<void> {
  await api.delete(`/api/admin/broadcasts/${id}`);
}

export async function fetchBroadcastPreview(
  id: string,
): Promise<BroadcastPreview> {
  const { data } = await api.get<BroadcastPreview>(
    `/api/admin/broadcasts/${id}/preview`,
  );
  return data;
}

/** Goes to the signed-in admin's own address only; the server takes no address. */
export async function sendBroadcastTest(
  id: string,
): Promise<BroadcastTestResult> {
  const { data } = await api.post<BroadcastTestResult>(
    `/api/admin/broadcasts/${id}/test`,
  );
  return data;
}

export async function startBroadcast(
  id: string,
  confirmRecipientCount: number,
): Promise<BroadcastDetail> {
  const { data } = await api.post<BroadcastDetail>(
    `/api/admin/broadcasts/${id}/send`,
    { confirmRecipientCount },
  );
  return data;
}

export async function cancelBroadcast(id: string): Promise<BroadcastDetail> {
  const { data } = await api.post<BroadcastDetail>(
    `/api/admin/broadcasts/${id}/cancel`,
  );
  return data;
}

// Public: the link in a bulk email (the token is the only thing in the URL)
export async function fetchUnsubscribeInfo(
  token: string,
): Promise<UnsubscribeInfo> {
  const { data } = await api.get<UnsubscribeInfo>(
    `/api/public/email/unsubscribe/${encodeURIComponent(token)}`,
  );
  return data;
}

export async function applyUnsubscribe(
  token: string,
): Promise<{ scope: UnsubscribeScope }> {
  const { data } = await api.post<{ scope: UnsubscribeScope }>(
    `/api/public/email/unsubscribe/${encodeURIComponent(token)}`,
  );
  return data;
}

// Signed-in customer: the unticked "send me offers and news" box at checkout
export async function fetchMarketingConsent(): Promise<MarketingConsent> {
  const { data } = await api.get<MarketingConsent>(
    "/api/user/marketing-consent",
  );
  return data;
}

export async function saveMarketingConsent(
  optedIn: boolean,
): Promise<{ optedIn: boolean }> {
  const { data } = await api.put<{ optedIn: boolean }>(
    "/api/user/marketing-consent",
    { optedIn },
  );
  return data;
}
