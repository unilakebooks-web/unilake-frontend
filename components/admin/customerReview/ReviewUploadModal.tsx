"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, Video, Loader2, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { requestVideoUploadUrl, createCustomerReview } from "@/app/actions/customerReview";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { toast } from "sonner";

interface ReviewUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export function ReviewUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: ReviewUploadModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [uploadState, setUploadState] = useState<
    "idle" | "requesting" | "uploading" | "registering" | "done" | "error"
  >("idle");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setCustomerName("");
      setDescription("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setErrorMessage(null);
      setUploadState("idle");
      setProgressPercent(0);
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_BYTES) {
      setErrorMessage(`Video must be under 100 MB. Please compress it and try again.`);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMessage(`Unsupported format (${file.type || "unknown"}). Only MP4, WebM, and MOV videos are accepted.`);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const dm = 2;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const handleUploadAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const trimmedName = customerName.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName || !trimmedDesc) {
      setErrorMessage("Customer name and description are required.");
      return;
    }

    setErrorMessage(null);
    try {
      setUploadState("requesting");
      const { uploadUrl, key } = await requestVideoUploadUrl(
        selectedFile.name,
        selectedFile.type
      );

      setUploadState("uploading");
      await uploadToR2({
        uploadUrl,
        file: selectedFile,
        contentType: selectedFile.type,
        onProgress: (percent) => setProgressPercent(percent),
      });

      setUploadState("registering");
      await createCustomerReview({
        customerName: trimmedName,
        description: trimmedDesc,
        videoKey: key,
      });

      setUploadState("done");
      toast.success("Review successfully uploaded!");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setUploadState("error");
      const errText = err?.message || "Upload operation failed";
      setErrorMessage(errText);
      toast.error(`Upload failed: ${errText}`);
    }
  };

  const isBusy = ["requesting", "uploading", "registering"].includes(uploadState);
  const canSubmit = selectedFile && customerName.trim() && description.trim() && !isBusy;

  return (
    <Dialog open={open} onOpenChange={isBusy ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white border border-[#914A8C]/20 shadow-2xl rounded-3xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#914A8C]/10 text-[#914A8C] flex items-center justify-center shrink-0 border border-[#914A8C]/15">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#914A8C]">
                Upload Customer Review
              </DialogTitle>
              <DialogDescription className="text-xs text-[#914A8C]/70 font-medium">
                Upload a video testimonial and add details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleUploadAndPublish} className="mt-4 space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="customerName" className="text-sm font-semibold text-neutral-800 block">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Priya Menon"
                disabled={isBusy}
                className="h-11 px-3.5 text-sm rounded-xl border-[#914A8C]/30 focus-visible:border-[#914A8C] focus-visible:ring-[#914A8C]/30 bg-[#F8E7D2]/20 text-neutral-900"
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold text-neutral-800 block">
                Description / Quote <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. My daughter couldn't believe she was in the book."
                disabled={isBusy}
                rows={3}
                className="w-full p-3.5 text-sm rounded-xl border border-[#914A8C]/30 focus-visible:outline-none focus-visible:border-[#914A8C] focus-visible:ring-1 focus-visible:ring-[#914A8C]/30 bg-[#F8E7D2]/20 text-neutral-900 resize-none"
                maxLength={500}
              />
            </div>
          </div>

          {/* File Selector */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#914A8C]/30 hover:border-[#914A8C] rounded-2xl p-8 text-center bg-[#F8E7D2]/25 hover:bg-[#F8E7D2]/40 transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center gap-2"
            >
              <div className="w-13 h-13 rounded-full bg-[#914A8C]/10 text-[#914A8C] group-hover:scale-110 transition-transform flex items-center justify-center mb-1">
                <Video className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-neutral-800">
                Click to browse video file
              </p>
              <div className="text-[12px] font-semibold text-[#914A8C]/80 flex flex-col items-center gap-0.5 mt-1 text-center">
                <p>Supported formats: MP4, WebM, MOV</p>
                <p>Max size: 100 MB</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-900 border border-[#914A8C]/30 shadow-md flex items-center justify-center min-h-[200px]">
                {previewUrl && (
                  <video
                    src={previewUrl}
                    controls
                    preload="metadata"
                    className="max-w-full max-h-[400px] object-contain"
                  />
                )}
                {!isBusy && (
                  <button
                    type="button"
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setErrorMessage(null);
                      setUploadState("idle");
                    }}
                    className="absolute top-3 right-3 bg-black/60 hover:bg-red-600 text-white p-2 rounded-xl backdrop-blur-md transition-colors shadow-sm cursor-pointer z-10"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700">
                <span className="truncate max-w-[260px] font-bold">{selectedFile.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 bg-[#914A8C]/10 text-[#914A8C] rounded-md uppercase font-mono text-[11px]">
                    {selectedFile.type.replace("video/", "")}
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
            accept="video/mp4, video/webm, video/quicktime"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isBusy}
          />

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {isBusy && (
            <div className="space-y-2 p-4 bg-[#F8E7D2]/30 rounded-2xl border border-[#914A8C]/20 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold text-[#914A8C]">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#914A8C]" />
                  {uploadState === "requesting" && "Step 1/3: Generating signature..."}
                  {uploadState === "uploading" && `Step 2/3: Uploading video (${progressPercent}%)...`}
                  {uploadState === "registering" && "Step 3/3: Saving review..."}
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
              type="submit"
              disabled={!canSubmit}
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
                  <span>Upload Review</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
