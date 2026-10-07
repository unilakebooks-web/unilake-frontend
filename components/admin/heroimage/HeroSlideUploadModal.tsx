"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { requestUploadUrl, createHeroImage } from "@/app/actions/heroimage";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { HeroImage } from "@/app/types/heroimage";
import { toast } from "sonner";

interface HeroSlideUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newImage: HeroImage) => void;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function HeroSlideUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: HeroSlideUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Upload status states: "idle" | "requesting" | "uploading" | "registering" | "done" | "error"
  const [uploadState, setUploadState] = useState<
    "idle" | "requesting" | "uploading" | "registering" | "done" | "error"
  >("idle");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset modal state on open/close
  useEffect(() => {
    if (!open) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      setErrorMessage(null);
      setUploadState("idle");
      setProgressPercent(0);
    }
  }, [open]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type per HERO_IMAGES_API.md
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMessage(
        `Unsupported format (${file.type || "unknown"}). Only PNG, JPEG, and WEBP images are accepted.`
      );
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    // Create object URL for high speed client-side preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Format file size nicely
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const dm = 2;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Execute the 3-step R2 direct upload process
  const handleUploadAndPublish = async () => {
    if (!selectedFile) return;

    setErrorMessage(null);
    try {
      // Step 1: Get presigned R2 upload target URL and object key
      setUploadState("requesting");
      const { uploadUrl, key } = await requestUploadUrl(
        selectedFile.name,
        selectedFile.type
      );

      // Step 2: Directly PUT raw bytes to Cloudflare R2 with XHR progress monitoring
      setUploadState("uploading");
      await uploadToR2({
        uploadUrl,
        file: selectedFile,
        contentType: selectedFile.type,
        onProgress: (percent) => setProgressPercent(percent),
      });

      // Step 3: Register verified object key in Postgres via backend endpoint
      setUploadState("registering");
      const createdImage = await createHeroImage(key);

      setUploadState("done");
      toast.success("Hero slide successfully uploaded & published!");
      onSuccess(createdImage);
      onOpenChange(false);
    } catch (err: any) {
      setUploadState("error");
      const errText = err?.message || "Upload operation failed";
      setErrorMessage(errText);
      toast.error(`Upload failed: ${errText}`);
    }
  };

  const isBusy = ["requesting", "uploading", "registering"].includes(uploadState);

  return (
    <Dialog open={open} onOpenChange={isBusy ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white border border-[#914A8C]/20 shadow-2xl rounded-3xl p-6 overflow-hidden">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#914A8C]/10 text-[#914A8C] flex items-center justify-center shrink-0 border border-[#914A8C]/15">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#914A8C]">
                Upload New Hero Slide
              </DialogTitle>
              <DialogDescription className="text-xs text-[#914A8C]/70 font-medium">
                Slides automatically publish to the storefront carousel instantly upon upload completion.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* File Selector / Drop area or Selected Preview */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#914A8C]/30 hover:border-[#914A8C] rounded-2xl p-8 text-center bg-[#F8E7D2]/25 hover:bg-[#F8E7D2]/40 transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center gap-2"
            >
              <div className="w-13 h-13 rounded-full bg-[#914A8C]/10 text-[#914A8C] group-hover:scale-110 transition-transform flex items-center justify-center mb-1">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-neutral-800">
                Click to browse or drop image file here
              </p>
              <div className="text-[12px] font-semibold text-[#914A8C]/80 flex flex-col items-center gap-0.5 mt-1 text-center">
                <p>Supported formats: PNG, JPEG, WEBP</p>
                <p>Recommended dimensions: 1080 × 1080 px (square, 1:1 ratio)</p>
                <p className="opacity-80">Non-square images are cropped at the edges to fit.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Thumbnail preview */}
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-neutral-900 border border-[#914A8C]/30 shadow-md">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Selected banner preview"
                    className="w-full h-full object-cover"
                  />
                )}
                {!isBusy && (
                  <button
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setErrorMessage(null);
                      setUploadState("idle");
                    }}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-red-600 text-white p-2 rounded-xl backdrop-blur-md transition-colors shadow-sm cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* File Info badge bar */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700">
                <span className="truncate max-w-[260px] font-bold">{selectedFile.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 bg-[#914A8C]/10 text-[#914A8C] rounded-md uppercase font-mono text-[11px]">
                    {selectedFile.type.replace("image/", "")}
                  </span>
                  <span className="text-neutral-500 font-mono">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isBusy}
          />

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Progress Bar & Stage Status during active upload */}
          {isBusy && (
            <div className="space-y-2 p-4 bg-[#F8E7D2]/30 rounded-2xl border border-[#914A8C]/20 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-[#914A8C]">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#914A8C]" />
                  {uploadState === "requesting" && "Step 1/3: Generating presigned R2 signature..."}
                  {uploadState === "uploading" && `Step 2/3: Uploading bytes directly to Cloudflare R2 (${progressPercent}%)...`}
                  {uploadState === "registering" && "Step 3/3: Registering verified slide in Postgres..."}
                </span>
                {uploadState === "uploading" && <span>{progressPercent}%</span>}
              </div>
              <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#914A8C] to-[#FFD54A] transition-all duration-300"
                  style={{
                    width: uploadState === "requesting" ? "15%" : uploadState === "uploading" ? `${Math.max(15, progressPercent)}%` : "95%",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-neutral-100 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
            className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-11 px-5 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUploadAndPublish}
            disabled={!selectedFile || isBusy}
            className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold h-11 px-6 shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : uploadState === "error" ? (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Retry Upload</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Upload & Publish</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
