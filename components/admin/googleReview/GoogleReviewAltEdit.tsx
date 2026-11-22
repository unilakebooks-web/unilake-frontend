"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useUpdateGoogleReviewAlt } from "@/hooks/useSeo";
import { getErrorMessage } from "@/lib/utils";
import type { GoogleReview } from "@/app/types/googleReview";

/** Inline edit of a review photo's description (alt text); an empty value clears it. */
export function GoogleReviewAltEdit({ review }: { review: GoogleReview }) {
  const updateAlt = useUpdateGoogleReviewAlt();
  const [altText, setAltText] = useState(review.imageAlt ?? "");
  const altDirty = altText.trim() !== (review.imageAlt ?? "");

  const handleSave = async () => {
    try {
      await updateAlt.mutateAsync({
        id: review.id,
        imageAlt: altText.trim() || null,
      });
      toast.success("Image description saved");
    } catch (err: unknown) {
      toast.error(
        "Failed to save description: " + getErrorMessage(err, "Server error"),
      );
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <Input
        value={altText}
        onChange={(e) => setAltText(e.target.value)}
        disabled={updateAlt.isPending}
        maxLength={200}
        placeholder="Image description (alt text), optional"
        aria-label={`Image description for ${review.customerName}`}
        className="h-9 text-sm rounded-xl bg-white"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={!altDirty || updateAlt.isPending}
        title="Save description"
        aria-label="Save description"
        className="w-9 h-9 rounded-xl bg-[#914A8C] text-white hover:bg-[#7a3e75] transition-colors flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {updateAlt.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
