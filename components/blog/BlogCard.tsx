import Image from "next/image";
import Link from "next/link";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import { BlogListItem } from "@/app/types/blog";

/**
 * One blog post card on the purple tab-shaped background. Shared by the
 * homepage "Blogs" section and the /blog index so the two never drift apart.
 *
 * GEOMETRY — blog.svg is 387×497. Its top-right corner is cut away for the
 * arrow circle: the card body there only reaches x = 258.5 (66.8% of the
 * width), and the full-width body begins at y ≈ 112 (28.9% of the WIDTH,
 * once the corner curve at the right content edge is cleared).
 *
 * Text must never sit in that cut-out — it is the page background, so white
 * text there spills visibly out of the card. So:
 *   - the title sits beside the arrow, padded clear of the cut-out (pr-[35%]);
 *   - the title block has a minimum height that ends just below the cut-out,
 *     so the excerpt ALWAYS starts beneath it and can use the full width.
 *
 * Every vertical measure is in `cqw` — a percentage of this card's width —
 * because the card keeps a fixed aspect ratio, so the cut-out is always the
 * same fraction of the width however wide the grid column is. Reference:
 *   content top     = 8cqw (pt-[8%], which is also % of width)
 *   cut-out clears  ≈ 30.4cqw from the card top (28.9 + 1.5 breathing room)
 *   title block     = 30.4 − 8 − 2 (excerpt margin) ≈ 20.5cqw minimum
 */
export default function BlogCard({ blog }: { blog: BlogListItem }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="@container relative group block w-full"
    >
      {/* SVG background shape — default state */}
      <Image
        src="/assets/home_page/blog.svg"
        alt=""
        width={387}
        height={497}
        aria-hidden="true"
        className="w-full h-auto block transition-opacity duration-900 ease-in-out group-hover:opacity-0"
        draggable={false}
      />
      {/* SVG background shape — hover state */}
      <Image
        src="/assets/home_page/blog_on_hover.svg"
        alt=""
        width={387}
        height={497}
        aria-hidden="true"
        className="w-full h-auto absolute inset-0 opacity-0 transition-opacity duration-900 ease-in-out group-hover:opacity-100"
        draggable={false}
      />

      {/* Card content overlay */}
      <div className="absolute inset-0 flex flex-col px-[10%] pt-[8%] pb-[8%]">
        {/* Title beside the arrow. min-h reserves the cut-out's full depth
            (see GEOMETRY above) so a short title can never let the excerpt
            ride up into the cut-out. A long title simply grows the block. */}
        <div className="pr-[35%] min-h-[20.5cqw] shrink-0">
          <h3
            className={`${chauPhilomeneOne.className} text-white text-xl sm:text-[22px] leading-[1.15] uppercase line-clamp-3 break-words`}
          >
            {blog.title}
          </h3>
        </div>

        {/* Excerpt — always below the cut-out, so it can use the full card
            width. break-words keeps a long URL or unbroken word inside. */}
        {blog.excerpt && (
          <p
            className={`${hankenGrotesk.className} text-white/90 text-xs sm:text-sm leading-relaxed mt-[2cqw] line-clamp-3 break-words`}
          >
            {blog.excerpt}
          </p>
        )}

        {/* Cover image — inset in the lower portion.
            Fixed box so every card in the grid stays the same height, but
            object-contain inside it — the admin can upload any shape and none
            of it is ever cut off. Mismatched ratios letterbox against the
            placeholder colour, which reads as deliberate. */}
        <div className="mt-auto relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#F3E8FF]">
          {blog.coverImageUrl ? (
            <Image
              src={blog.coverImageUrl}
              alt={blog.title}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#F3E8FF] text-[#8E4A92]/40">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-12 h-12"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
