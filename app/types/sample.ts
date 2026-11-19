import type { SessionStatus } from "./session";

export interface SampleListItem {
  id: string;
  status: SessionStatus;
  childName: string | null;
  createdAt: string;
  expiresAt: string;
  createdById: string | null;
  comic: { id: string; title: string };
  pageCount: number;
  /** False once the sample expired or was discarded; its files are deleted soon after. */
  isLive: boolean;
}

export interface CreateSamplePayload {
  comicId: string;
  childName: string;
  age: number;
  pronounKey: "HE" | "SHE";
  pageIds: string[];
}

export interface CreateSampleResponse {
  sessionId: string;
  wsRoomToken: string;
  expiresAt: string;
}

export interface SampleSelection {
  pageId: string;
  pageVersionId: string;
}
