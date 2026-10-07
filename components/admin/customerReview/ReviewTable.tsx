"use client";

import { CustomerReview } from "@/app/types/customerReview";
import { Star, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ReviewTableProps {
  reviews: CustomerReview[];
  togglingId: string | null;
  onToggleStatus: (id: string) => void;
  onDelete: (review: CustomerReview) => void;
  onAddFirst: () => void;
}

export function ReviewTable({
  reviews,
  togglingId,
  onToggleStatus,
  onDelete,
  onAddFirst,
}: ReviewTableProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#914A8C]/25 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] mb-4 shadow-inner">
          <Star className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 tracking-wide mb-2">
          No Customer Reviews Yet
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 font-medium leading-relaxed">
          Upload video testimonials to display them on the homepage.
        </p>
        <button
          onClick={onAddFirst}
          className="px-6 py-3 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        >
          + Add First Review
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => {
        const isToggling = togglingId === review.id;
        
        return (
          <div
            key={review.id}
            className={`
              flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 
              bg-white/70 backdrop-blur-sm rounded-2xl border transition-all shadow-sm
              ${review.isActive ? "border-[#914A8C]/20 hover:shadow-md" : "border-neutral-200 opacity-60 grayscale-[0.2] hover:opacity-100 hover:grayscale-0"}
            `}
          >
            {/* Left Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Video Thumbnail (or just video element without autoplay) */}
              <div className="w-20 h-20 rounded-xl bg-neutral-900 border border-neutral-200 shrink-0 overflow-hidden relative">
                <video 
                  src={review.videoUrl} 
                  preload="metadata"
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-neutral-800 text-base truncate">
                    {review.customerName}
                  </h3>
                  {!review.isActive && (
                    <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-600 line-clamp-2">
                  {review.description}
                </p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 shrink-0 justify-end mt-2 sm:mt-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 select-none">
                  Status
                </span>
                <Switch
                  checked={review.isActive}
                  disabled={isToggling}
                  onCheckedChange={() => onToggleStatus(review.id)}
                  className="data-[state=checked]:bg-[#914A8C]"
                />
              </div>

              <div className="w-px h-6 bg-neutral-200 hidden sm:block" />

              <button
                onClick={() => onDelete(review)}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Delete Review"
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
