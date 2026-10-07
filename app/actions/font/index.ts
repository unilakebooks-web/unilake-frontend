import axios from "axios";
import api from "@/app/lib/axios";
import type { Font, FontWithCount, UploadUrlResponse } from "@/app/types/comic";

export async function fetchFonts(comicId: string): Promise<FontWithCount[]> {
  const { data } = await api.get<FontWithCount[]>(`/api/admin/comics/${comicId}/fonts`);
  return data;
}

export async function requestFontUploadUrl(comicId: string, payload: { fileName: string, fileExtension: string }): Promise<UploadUrlResponse> {
  const { data } = await api.post<UploadUrlResponse>(`/api/admin/comics/${comicId}/fonts/upload-url`, payload);
  return data;
}

export async function createFont(comicId: string, payload: { name: string, fontKey: string }): Promise<Font> {
  const { data } = await api.post<Font>(`/api/admin/comics/${comicId}/fonts`, payload);
  return data;
}

export async function updateFont(fontId: string, payload: { name?: string, fontKey?: string }): Promise<Font> {
  const { data } = await api.patch<Font>(`/api/admin/fonts/${fontId}`, payload);
  return data;
}

export async function deleteFont(fontId: string): Promise<void> {
  await api.delete(`/api/admin/fonts/${fontId}`);
}

/**
 * Raw bytes of a font file, for drawing text on the bubble-mapper canvas.
 *
 * The endpoint returns the file itself, not the JSON envelope. The browser's
 * HTTP cache handles revalidation (ETag → 304) on its own.
 *
 * Uses plain axios (same base URL, same cookies), NOT the shared `api`
 * instance: on failure the error body arrives as an ArrayBuffer, which the
 * shared interceptor cannot read — it would replace it with a bare "Request
 * failed with status code 404" and drop the response. Here the body is decoded
 * so the backend's real message ("Font file is missing from storage…") reaches
 * the admin.
 */
export async function fetchFontFile(fontId: string): Promise<ArrayBuffer> {
  try {
    const { data } = await axios.get<ArrayBuffer>(`/api/admin/fonts/${fontId}/file`, {
      baseURL: api.defaults.baseURL,
      withCredentials: true,
      responseType: "arraybuffer",
    });
    return data;
  } catch (error) {
    throw new Error(readFontFileError(error));
  }
}

function readFontFileError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;

    if (body instanceof ArrayBuffer) {
      try {
        const parsed = JSON.parse(new TextDecoder().decode(body));
        if (typeof parsed?.error?.message === "string") return parsed.error.message;
      } catch {
        // Not JSON — fall through to the generic message.
      }
    }

    if (error.message) return error.message;
  }

  return "Could not load the font file.";
}
