"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { MAX_RATING } from "@/app/types/googleReview";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

/**
 * Clickable 1–5 star picker with hover preview.
 *
 * Built as a radiogroup rather than a row of buttons so it is reachable by
 * keyboard: arrow keys move between stars and the selected value is announced.
 * A plain set of buttons would be clickable but effectively invisible to a
 * screen reader, since the only label would be the icon.
 */
export function StarRatingInput({
  value,
  onChange,
  disabled = false,
}: StarRatingInputProps) {
  // Which star the pointer is over, or null. Drives the preview only — it
  // never changes the committed value.
  const [hovered, setHovered] = useState<number | null>(null);

  const displayed = hovered ?? value;

  return (
    <div
      role="radiogroup"
      aria-label="Star rating"
      className="flex items-center gap-1"
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((star) => {
        const isFilled = star <= displayed;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onFocus={() => !disabled && setHovered(star)}
            onBlur={() => setHovered(null)}
            className={`p-0.5 rounded transition-transform ${
              disabled
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:scale-110"
            } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#914A8C]/40`}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-neutral-300"
              }`}
            />
          </button>
        );
      })}

      <span className="ml-2 text-sm font-semibold text-neutral-600 tabular-nums">
        {value > 0 ? `${value} / ${MAX_RATING}` : "Not set"}
      </span>
    </div>
  );
}
