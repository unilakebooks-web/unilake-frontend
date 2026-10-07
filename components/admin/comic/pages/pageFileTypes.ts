import { PageFileExtension } from "@/app/types/comic";

/**
 * The backend signs each presigned URL with these exact content types, and the
 * S3 signature COVERS the Content-Type header. Deriving it from the extension
 * here — rather than trusting the browser's file.type — is what stops the PUT
 * being rejected by Cloudflare with an opaque 403 and an XML body.
 *
 * Mirrors the contentTypeMap in backend/src/services/page.service.ts.
 */
export const PAGE_CONTENT_TYPES: Record<PageFileExtension, string> = {
  [PageFileExtension.JPG]: "image/jpeg", // note: there is no image/jpg
  [PageFileExtension.JPEG]: "image/jpeg",
  [PageFileExtension.PNG]: "image/png",
  [PageFileExtension.WEBP]: "image/webp",
};

export const PAGE_FILE_ERROR =
  "Only JPG, JPEG, PNG and WEBP images are allowed.";

/**
 * Returns the file's extension if the backend accepts it, otherwise null.
 *
 * Uses a regex rather than split(".").pop() because a file with no extension
 * would otherwise yield the whole filename — "artwork" would be sent as the
 * extension.
 */
export function getPageExtension(file: File): PageFileExtension | null {
  const match = file.name.match(/\.([a-z0-9]+)$/i);
  if (!match) return null;

  const ext = match[1].toLowerCase();
  return (Object.values(PageFileExtension) as string[]).includes(ext)
    ? (ext as PageFileExtension)
    : null;
}
