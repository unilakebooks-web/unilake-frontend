import api from "@/app/lib/axios";
import type {
  CreateSamplePayload,
  CreateSampleResponse,
  SampleListItem,
  SampleSelection,
} from "@/app/types/sample";

export async function fetchSamples(): Promise<SampleListItem[]> {
  const { data } = await api.get<SampleListItem[]>("/api/admin/samples");
  return data;
}

export async function createSample(
  payload: CreateSamplePayload,
): Promise<CreateSampleResponse> {
  const { data } = await api.post<CreateSampleResponse>(
    "/api/admin/samples",
    payload,
  );
  return data;
}

// Ends the sample now; its files and rows are deleted by the server a few minutes later.
export async function discardSample(sessionId: string): Promise<void> {
  await api.delete(`/api/admin/samples/${sessionId}`);
}

// The server builds the PDF of the chosen versions and stores nothing.
export async function downloadSamplePdf(
  sessionId: string,
  selections: SampleSelection[],
  fileName: string,
): Promise<void> {
  // validateStatus lets an error answer through as a Blob, so the server's message can be read:
  // with responseType "blob" the shared error handling would otherwise only see axios's own text.
  const response = await api.post<Blob>(
    `/api/admin/samples/${sessionId}/pdf`,
    { selections },
    { responseType: "blob", validateStatus: () => true },
  );

  if (response.status >= 400) {
    let message = "Could not build the PDF.";
    try {
      const body = JSON.parse(await response.data.text());
      message = body?.error?.message ?? message;
    } catch {
      // not JSON: keep the generic message
    }
    throw { code: "SAMPLE_PDF_FAILED", message };
  }

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
