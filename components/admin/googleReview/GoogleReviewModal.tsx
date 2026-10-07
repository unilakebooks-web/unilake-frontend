"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  UploadCloud,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { getErrorMessage } from "@/lib/utils";
import {
  useCreateGoogleReview,
  useUpdateGoogleReview,
} from "@/hooks/useGoogleReviews";
import { requestGoogleReviewUploadUrl } from "@/app/actions/googleReview";
import type {
  GoogleReview,
  UpdateGoogleReviewPayload,
} from "@/app/types/googleReview";
import { StarRatingInput } from "./StarRatingInput";

interface GoogleReviewModalProps {
  onOpenChange: (open: boolean) => void;
  review: GoogleReview | null;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const DEFAULT_RATING = 5;

/**
 * Add / edit dialog for a Google review.
 *
 * The caller mounts this ONLY while the dialog is open, and keys it by the
 * review being edited (see the admin page). That makes every open a fresh
 * mount, so all state below initialises straight from props and there is
 * nothing to reset — no syncing effect, and no chance of a previous edit
 * leaking into the next one.
 */
export function GoogleReviewModal({
  onOpenChange,
  review,
}: GoogleReviewModalProps) {
  const isEditMode = !!review;

  const createReview = useCreateGoogleReview();
  const updateReview = useUpdateGoogleReview();

  const [customerName, setCustomerName] = useState(review?.customerName ?? "");
  const [rating, setRating] = useState(review?.rating ?? DEFAULT_RATING);
  const [reviewText, setReviewText] = useState(review?.reviewText ?? "");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Starts as the existing R2 URL when editing. Swapped for a local blob: URL
  // once the admin picks a new file.
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    review?.imageUrl ?? null
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "saving"
  >("idle");
  const [progressPercent, setProgressPercent] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMessage(
        `Unsupported format (${file.type || "unknown"}). Only PNG, JPEG, and WEBP images are accepted.`
      );
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const isBusy = uploadState !== "idle";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    const trimmedName = customerName.trim();
    const trimmedText = reviewText.trim();

    if (!trimmedName || !trimmedText) {
      setErrorMessage("Customer name and review text are required.");
      return;
    }

    // The image column is NOT NULL, so a new review cannot be saved without
    // one. On edit, keeping the existing image is fine — only a brand-new
    // review can be missing it.
    if (!isEditMode && !selectedFile) {
      setErrorMessage("Please upload a display image for this review.");
      return;
    }

    setErrorMessage(null);

    try {
      let imageKey: string | undefined;

      if (selectedFile) {
        setUploadState("uploading");
        const { uploadUrl, key } = await requestGoogleReviewUploadUrl(
          selectedFile.name,
          selectedFile.type
        );

        await uploadToR2({
          uploadUrl,
          file: selectedFile,
          contentType: selectedFile.type,
          onProgress: setProgressPercent,
        });

        imageKey = key;
      }

      setUploadState("saving");

      if (isEditMode) {
        // Omitting imageKey keeps the current image — the API has no way to
        // clear it, by design.
        const payload: UpdateGoogleReviewPayload = {
          customerName: trimmedName,
          rating,
          reviewText: trimmedText,
          ...(imageKey ? { imageKey } : {}),
        };
        await updateReview.mutateAsync({ id: review.id, payload });
        toast.success("Review updated");
      } else {
        await createReview.mutateAsync({
          customerName: trimmedName,
          rating,
          reviewText: trimmedText,
          imageKey: imageKey as string, // guarded above
        });
        toast.success("Review added");
      }

      onOpenChange(false);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Something went wrong. Please try again.");
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setUploadState("idle");
      setProgressPercent(0);
    }
  };

  return (
    <Dialog open onOpenChange={(next) => !isBusy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Google Review" : "Add Google Review"}
          </DialogTitle>
          <DialogDescription>
            Shown in the &quot;Excellent On Google&quot; section on the homepage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Image */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-900">
              Display Image {!isEditMode && <span className="text-red-500">*</span>}
            </label>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full border-2 border-neutral-200 overflow-hidden bg-neutral-100 shrink-0">
                {previewUrl ? (
                  // Plain <img>: the preview is often a blob: URL, which
                  // next/image cannot optimise.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Reviewer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl"
                >
                  {previewUrl ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Replace image
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Upload image
                    </>
                  )}
                </Button>
                <p className="text-xs text-neutral-500 mt-1.5">
                  PNG, JPEG or WEBP. Shown as a circular avatar.
                </p>
              </div>
            </div>

            {uploadState === "uploading" && (
              <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#914A8C] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-900">
              Star Rating <span className="text-red-500">*</span>
            </label>
            <StarRatingInput
              value={rating}
              onChange={setRating}
              disabled={isBusy}
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label
              htmlFor="review-name"
              className="text-sm font-semibold text-neutral-900"
            >
              Customer Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="review-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Kamlesh Patel"
              disabled={isBusy}
              className="h-11 rounded-xl bg-white"
            />
          </div>

          {/* Review text */}
          <div className="space-y-2">
            <label
              htmlFor="review-text"
              className="text-sm font-semibold text-neutral-900"
            >
              Review <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder="Great experience. Print quality came out much better than expected…"
              disabled={isBusy}
              className="rounded-xl bg-white resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isBusy}
              className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadState === "uploading" ? "Uploading..." : "Saving..."}
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Add Review"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
