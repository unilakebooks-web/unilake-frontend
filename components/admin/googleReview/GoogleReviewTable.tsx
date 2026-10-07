"use client";

import { Loader2, Pencil, Star, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { MAX_RATING, type GoogleReview } from "@/app/types/googleReview";

interface GoogleReviewTableProps {
  reviews: GoogleReview[];
  togglingId: string | null;
  onToggleStatus: (id: string) => void;
  onEdit: (review: GoogleReview) => void;
  onDelete: (review: GoogleReview) => void;
}

/** Read-only star display. Fills `rating` stars and greys out the remainder. */
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of ${MAX_RATING} stars`}
    >
      {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-transparent text-neutral-300"
          }`}
        />
      ))}
    </div>
  );
}

export function GoogleReviewTable({
  reviews,
  togglingId,
  onToggleStatus,
  onEdit,
  onDelete,
}: GoogleReviewTableProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-12 text-center">
        <Star className="w-10 h-10 text-[#914A8C]/40 mx-auto mb-3" />
        <h3 className="font-bold text-neutral-900 mb-1">No reviews yet</h3>
        <p className="text-sm text-neutral-500">
          Add your first Google review to show the section on the homepage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const isToggling = togglingId === review.id;

        return (
          <div
            key={review.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15 shadow-sm"
          >
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-200 bg-neutral-100 shrink-0">
                {/* Plain <img>: a small fixed-size avatar from R2, not worth
                    routing through next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={review.imageUrl}
                  alt={review.customerName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-bold text-neutral-900 leading-tight">
                    {review.customerName}
                  </h3>
                  <StarDisplay rating={review.rating} />
                </div>
                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                  {review.reviewText}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 pl-16 sm:pl-0">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${
                    review.isActive ? "text-emerald-600" : "text-neutral-400"
                  }`}
                >
                  {review.isActive ? "Live" : "Hidden"}
                </span>
                {isToggling ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#914A8C]" />
                ) : (
                  <Switch
                    checked={review.isActive}
                    onCheckedChange={() => onToggleStatus(review.id)}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-300 cursor-pointer"
                    aria-label={`Show ${review.customerName}'s review on the homepage`}
                  />
                )}
              </div>

              <button
                onClick={() => onEdit(review)}
                className="p-2 rounded-xl text-neutral-500 hover:text-[#914A8C] hover:bg-[#914A8C]/10 transition-colors cursor-pointer"
                aria-label={`Edit ${review.customerName}'s review`}
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => onDelete(review)}
                className="p-2 rounded-xl text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                aria-label={`Delete ${review.customerName}'s review`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
