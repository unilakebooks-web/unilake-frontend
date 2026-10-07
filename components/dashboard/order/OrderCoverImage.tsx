import { BookOpen } from "lucide-react";
import type { OrderComicSummary, UserGeneratedCover } from "@/app/types/order";

/**
 * The picture on a customer's order: the child's generated page 1, drawn at the
 * page's real shape with its long edge capped at `longEdgePx` — so a landscape
 * comic shows whole instead of being cropped into a portrait frame.
 *
 * Falls back to the comic's marketing thumbnail (in the old 3:4 portrait box,
 * since its dimensions are unknown) when nothing has generated yet, and to an
 * icon when there is no thumbnail either.
 */
export function OrderCoverImage({
  generatedCover,
  comic,
  longEdgePx,
}: {
  generatedCover: UserGeneratedCover | null;
  comic: OrderComicSummary;
  longEdgePx: number;
}) {
  // Portrait 3:4 — the box every order image used before this component.
  const fallbackBox = { width: Math.round(longEdgePx * 0.75), height: longEdgePx };

  let box = fallbackBox;
  if (generatedCover?.width && generatedCover.height) {
    const ratio = generatedCover.width / generatedCover.height;
    box =
      ratio >= 1
        ? { width: longEdgePx, height: Math.round(longEdgePx / ratio) }
        : { width: Math.round(longEdgePx * ratio), height: longEdgePx };
  }

  const url = generatedCover?.imageUrl ?? comic.coverThumbnailUrls?.[0];

  return (
    <div
      className="shrink-0 rounded-lg overflow-hidden bg-[#F8E7D2] border border-[#914A8C]/10"
      style={box}
    >
      {url ? (
        <img
          src={url}
          alt={generatedCover ? `${comic.title} — your personalized cover` : ""}
          // The generated box already matches the page's ratio, so contain
          // shows the whole page. The fallback thumbnail keeps its old crop.
          className={`w-full h-full ${generatedCover ? "object-contain" : "object-cover"}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#914A8C]/40" />
        </div>
      )}
    </div>
  );
}
