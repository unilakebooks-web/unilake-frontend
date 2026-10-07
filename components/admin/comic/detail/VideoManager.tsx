"use client";

import { useState, useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud, Trash2, Loader2, Film, RefreshCw } from "lucide-react";
import { ComicDetail } from "@/app/types/comic";
import { useSetComicVideo } from "@/hooks/useComics";
import { getComicVideoUploadUrl } from "@/app/actions/comic";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { toast } from "sonner";

interface VideoManagerProps {
  comic: ComicDetail;
}

// Frontend-only cap, matching the rest of the system — presigned URLs sign no
// ContentLength, so R2 itself will accept any size. This stops the accident,
// not a determined caller.
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

// MOV is deliberately absent: the backend validator rejects it, and no browser
// reliably plays video/quicktime in a <video> tag anyway.
const ACCEPTED_VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
};

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The axios interceptor rejects with a plain `{ code, message }` object rather
 * than an Error, so `err instanceof Error` misses every API failure. Duck-type
 * the message instead, and cover thrown Errors with the same check.
 */
function errorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return "Unknown error";
}

export function VideoManager({ comic }: VideoManagerProps) {
  const { mutateAsync: setVideo, isPending: isUpdating } = useSetComicVideo();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentVideoUrl = comic.previewVideoUrl;
  const isWorking = isUploading || isUpdating;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      try {
        setIsUploading(true);
        setProgress(0);

        const { uploadUrl, key } = await getComicVideoUploadUrl(
          file.name,
          file.type
        );

        await uploadToR2({
          uploadUrl,
          file,
          contentType: file.type,
          onProgress: setProgress,
        });

        // Only now does the comic learn about the file. If the PUT above failed
        // we never get here, and the orphaned object is the cost of a retry.
        await setVideo({ comicId: comic.id, videoKey: key });

        toast.success(
          currentVideoUrl ? "Video replaced successfully" : "Video added successfully"
        );
      } catch (err: unknown) {
        toast.error("Failed to upload video: " + errorMessage(err));
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [comic.id, currentVideoUrl, setVideo]
  );

  // react-dropzone silently swallows oversized/wrong-type files otherwise, which
  // reads as "the drop did nothing".
  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const reason = rejections[0]?.errors[0];

    if (reason?.code === "file-too-large") {
      toast.error(
        `That video is too large. Maximum size is ${formatMb(MAX_VIDEO_BYTES)}.`
      );
      return;
    }
    if (reason?.code === "file-invalid-type") {
      toast.error("Only MP4 and WebM videos are supported. Convert MOV files first.");
      return;
    }
    toast.error(reason?.message ?? "That file could not be accepted.");
  }, []);

  const handleRemove = async () => {
    if (!confirm("Remove this video? The file is permanently deleted from storage.")) {
      return;
    }

    try {
      await setVideo({ comicId: comic.id, videoKey: null });
      toast.success("Video removed");
    } catch (err: unknown) {
      toast.error("Failed to remove video: " + errorMessage(err));
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_VIDEO_TYPES,
    maxSize: MAX_VIDEO_BYTES,
    multiple: false,
    noClick: Boolean(currentVideoUrl),
    noDrag: Boolean(currentVideoUrl),
    disabled: isWorking,
  });

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Promo Video</h2>
          <p className="text-sm text-neutral-500">
            Optional. Shown as the 3rd slide in the storefront carousel.
          </p>
        </div>
        {isWorking && (
          <div className="flex items-center text-xs font-semibold text-[#914A8C] bg-[#914A8C]/10 px-3 py-1 rounded-full">
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            {isUploading ? `Uploading ${progress}%` : "Updating..."}
          </div>
        )}
      </div>

      {currentVideoUrl ? (
        <div className="space-y-4">
          <div className="bg-black rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
            <video
              key={currentVideoUrl}
              src={currentVideoUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[360px] object-contain bg-black"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={open}
              disabled={isWorking}
              className="inline-flex items-center gap-2 rounded-full bg-[#914A8C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7d3f79] disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Replace video
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isWorking}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
            <p className="text-xs text-neutral-500">
              MP4 or WebM, up to {formatMb(MAX_VIDEO_BYTES)}.
            </p>
          </div>

          {/* The dropzone root still has to be mounted for `open()` to work, but
              it is click/drag-disabled while a video exists — replacing is an
              explicit button, never an accidental drop onto the preview. */}
          <div {...getRootProps()} className="hidden">
            <input {...getInputProps()} />
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            isDragActive
              ? "border-[#914A8C] bg-[#914A8C]/5"
              : isWorking
                ? "border-neutral-200 opacity-50 cursor-not-allowed bg-neutral-50"
                : "border-neutral-200 hover:border-[#914A8C]/50 hover:bg-neutral-50 cursor-pointer"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#F8E7D2] flex items-center justify-center text-[#914A8C]">
              {isUploading ? (
                <UploadCloud className="w-5 h-5 animate-pulse" />
              ) : (
                <Film className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {isUploading
                  ? `Uploading… ${progress}%`
                  : "Click or drag a video to add one"}
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                MP4 or WebM, up to {formatMb(MAX_VIDEO_BYTES)}. Optional — a comic
                without a video simply shows its images.
              </p>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-[#914A8C] transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
