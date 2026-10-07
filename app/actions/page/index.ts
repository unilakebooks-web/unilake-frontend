import api from "@/app/lib/axios";
import type {
  Page,
  PageWithBubblesAndFont,
  PreviewStampRequest,
  PreviewStampResponse,
  UploadUrlResponse,
} from "@/app/types/comic";

export async function fetchPages(comicId: string): Promise<PageWithBubblesAndFont[]> {
  const { data } = await api.get<PageWithBubblesAndFont[]>(`/api/admin/comics/${comicId}/pages`);
  return data;
}

export async function requestPageUploadUrl(comicId: string, payload: { fileExtension: string, fileType: string }): Promise<UploadUrlResponse> {
  const { data } = await api.post<UploadUrlResponse>(`/api/admin/comics/${comicId}/pages/upload-url`, payload);
  return data;
}

export async function createPage(comicId: string, payload: Partial<Page> & { pageNumber: number }): Promise<Page> {
  const { data } = await api.post<Page>(`/api/admin/comics/${comicId}/pages`, payload);
  return data;
}

export async function updatePage(pageId: string, payload: Partial<Page>): Promise<Page> {
  const { data } = await api.patch<Page>(`/api/admin/pages/${pageId}`, payload);
  return data;
}

export async function deletePage(pageId: string): Promise<void> {
  await api.delete(`/api/admin/pages/${pageId}`);
}

/**
 * Renders this page's text stamping with the given name and pronoun, using the
 * bubbles passed in rather than whatever is stored. That is what lets the
 * mapper preview unsaved edits.
 *
 * Text only — no face swap. Nothing is saved; the response is a data URI.
 */
export async function previewPageStamp(
  pageId: string,
  payload: PreviewStampRequest
): Promise<PreviewStampResponse> {
  const { data } = await api.post<PreviewStampResponse>(
    `/api/admin/pages/${pageId}/preview-stamp`,
    payload
  );
  return data;
}

/**
 * Reorders a comic's pages. Position in `orderedPageIds` becomes the new
 * pageNumber (index 0 -> page 1). The backend requires the COMPLETE set of the
 * comic's page IDs — a partial list is rejected with a 400.
 *
 * Note this route is nested under the comic, unlike updatePage/deletePage.
 * Returns the full page list in its new order.
 */
export async function reorderPages(
  comicId: string,
  orderedPageIds: string[]
): Promise<PageWithBubblesAndFont[]> {
  const { data } = await api.patch<PageWithBubblesAndFont[]>(
    `/api/admin/comics/${comicId}/pages/reorder`,
    { orderedPageIds }
  );
  return data;
}
