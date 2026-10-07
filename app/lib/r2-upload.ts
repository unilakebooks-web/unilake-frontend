interface R2UploadOptions {
  uploadUrl: string;
  file: File;
  contentType: string;
  onProgress?: (percent: number) => void;
}

/**
 * Directly uploads raw file bytes to Cloudflare R2 via presigned URL using XMLHttpRequest
 * to provide real-time percentage progress tracking without triggering CORS / auth conflicts.
 */
export function uploadToR2({
  uploadUrl,
  file,
  contentType,
  onProgress,
}: R2UploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.open("PUT", uploadUrl);
    // Explicitly match the exact content-type signed in step 1
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Upload failed with status ${xhr.status}: ${xhr.statusText || "Unknown error"}`
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error occurred while uploading directly to R2 storage."));
    };

    xhr.onabort = () => {
      reject(new Error("Upload operation was aborted by the user or network timeout."));
    };

    // Send raw file directly as body (never wrapped in FormData)
    xhr.send(file);
  });
}
