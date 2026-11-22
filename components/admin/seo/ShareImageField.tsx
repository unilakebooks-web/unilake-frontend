"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { getErrorMessage } from "@/lib/utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // same 5MB limit as the blog cover

/** The size link previews are designed for; shown to the admin next to every share image. */
export const SHARE_IMAGE_SIZE_HINT = "Recommended size 1200 × 630 px (about 1.9 : 1).";

interface ShareImageFieldProps {
  /** The saved image, or the local preview of one just uploaded. Null when there is none. */
  imageUrl: string | null;
  /** Called after the file is in storage. `key` goes in the save payload; `previewUrl` is local. */
  onUploaded: (key: string, previewUrl: string) => void;
  onRemove: () => void;
  /** The resource's own upload-url call. */
  requestUploadUrl: (
    fileName: string,
    contentType: string
  ) => Promise<{ uploadUrl: string; key: string }>;
  disabled?: boolean;
  /** Shown under the box, for example what is used when no share image is set. */
  fallbackNote?: string;
}

/**
 * Upload box for a share image. Same flow as the blog cover (upload URL, direct PUT to R2, key kept until
 * the form is saved), in a 1200 x 630 frame so the admin sees what a link preview crops to.
 */
export function ShareImageField({
  imageUrl,
  onUploaded,
  onRemove,
  requestUploadUrl,
  disabled = false,
  fallbackNote,
}: ShareImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  // The blob URL of the last upload; revoked once the preview is replaced or removed, and on unmount.
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (previewUrlRef.current && imageUrl !== previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Share image must be under 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const { uploadUrl, key } = await requestUploadUrl(file.name, file.type);
      await uploadToR2({ uploadUrl, file, contentType: file.type });
      const previewUrl = URL.createObjectURL(file);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = previewUrl;
      onUploaded(key, previewUrl);
      toast.success("Share image uploaded (pending save)");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to upload share image"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isBusy = disabled || isUploading;

  return (
    <div className="space-y-1.5">
      {imageUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 aspect-[1200/630] w-full max-w-md group">
          {/* contain, not cover: a preview that crops would misrepresent what the link card shows. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Share preview" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => !isBusy && fileInputRef.current?.click()}
              disabled={isBusy}
              className="p-3 bg-white text-gray-700 rounded-xl shadow-lg hover:scale-105 transition-transform"
              title="Replace image"
              aria-label="Replace image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={isBusy}
              className="p-3 bg-red-500 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
              title="Remove image"
              aria-label="Remove image"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !isBusy && fileInputRef.current?.click()}
          disabled={isBusy}
          className={`border-2 border-dashed border-gray-300 rounded-2xl aspect-[1200/630] w-full max-w-md flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-50 ${
            !isBusy
              ? "cursor-pointer hover:bg-gray-100 hover:border-[#914A8C]/50 hover:text-[#914A8C] transition-colors"
              : ""
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-7 h-7 animate-spin text-[#914A8C]" />
              <span className="text-sm font-semibold text-gray-600">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm font-semibold">Click to upload share image</span>
            </>
          )}
        </button>
      )}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFile}
        disabled={isBusy}
      />
      <p className="text-xs text-neutral-500">
        {SHARE_IMAGE_SIZE_HINT} PNG, JPG or WEBP, max 5 MB.
        {fallbackNote ? ` ${fallbackNote}` : ""}
      </p>
    </div>
  );
}
