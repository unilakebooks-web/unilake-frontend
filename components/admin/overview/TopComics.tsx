"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import type { TopComic } from "@/app/types/stats";
import { formatMoneyCompact } from "@/lib/utils";

/**
 * Best-selling comics for the selected range.
 *
 * Horizontal bars, because the labels are comic titles — vertical columns would
 * force rotated text or truncation that hides which book is which. The bar is
 * scaled against the top seller rather than the total: the question here is
 * "which is doing best", not "what share of everything".
 *
 * One hue for every bar. These are ranked magnitudes of the same quantity, not
 * distinct categories, so giving each a different colour would imply a
 * difference in kind that is not there.
 */
export function TopComics({ comics }: { comics: TopComic[] }) {
  const router = useRouter();

  if (comics.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <BookOpen className="w-8 h-8 text-[#914A8C]/30 mb-3" />
        <p className="font-bold text-neutral-900 mb-1">Nothing sold yet</p>
        <p className="text-sm text-neutral-500">
          Best sellers appear here once orders come through.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...comics.map((comic) => comic.orderCount));

  return (
    <div className="space-y-3">
      {comics.map((comic) => (
        <div
          key={`${comic.comicId}-${comic.currency}`}
          onClick={() => router.push(`/admin/comics/${comic.comicId}`)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-12 rounded-lg overflow-hidden bg-[#F8E7D2] shrink-0 relative">
            {comic.coverThumbnailUrl ? (
              <Image
                src={comic.coverThumbnailUrl}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-[#914A8C]/40" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <span className="text-sm font-bold text-neutral-900 truncate group-hover:text-[#914A8C] transition-colors">
                {comic.title}
              </span>
              <span className="text-xs font-semibold text-neutral-500 tabular-nums shrink-0 whitespace-nowrap">
                {comic.orderCount} ·{" "}
                {formatMoneyCompact(comic.revenue, comic.currency)}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((comic.orderCount / maxCount) * 100, 3)}%`,
                  backgroundColor: "var(--chart-1)",
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
