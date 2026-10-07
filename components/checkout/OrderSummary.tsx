import Image from "next/image";
import { SessionSnapshot } from "@/app/types/session";
import { usePublicComic } from "@/hooks/usePublicComics";
import { useCountryStore } from "@/stores/useCountryStore";
import { resolveMrp } from "@/lib/utils";

interface OrderSummaryProps {
  snapshot: SessionSnapshot;
}

/** Long edge of the image box, in px. The short edge follows the page's ratio. */
const IMAGE_BOX_LONG_EDGE_PX = 128;

/** Box used for the marketing-thumbnail fallback, whose dimensions are unknown. */
const FALLBACK_BOX = { width: 96, height: 128 };

type SummaryImage = {
  url: string;
  width: number;
  height: number;
  /** True when this is the child's generated page, false for the fallback thumbnail. */
  isGenerated: boolean;
};

/**
 * The picture for the summary: the child's first generated page.
 *
 * "First" is the lowest-numbered page with a finished variant, and of that page
 * the NEWEST finished variant — the same one the preview page shows by default
 * (see newestReadyIndex in PreviewViewer). The customer's in-preview pick is not
 * persisted anywhere, so this is the closest match to what they last saw.
 *
 * The box takes the page's real aspect ratio with its long edge capped, so a
 * landscape comic shows whole instead of being cropped into a portrait frame.
 * Falls back to the comic's marketing thumbnail when nothing has finished.
 */
function resolveSummaryImage(
  snapshot: SessionSnapshot,
  metadataPages: { pageNumber: number; artworkWidth: number | null; artworkHeight: number | null }[]
): SummaryImage | null {
  const pages = [...snapshot.pages].sort((a, b) => a.pageNumber - b.pageNumber);

  for (const page of pages) {
    const ready = page.variants.filter((v) => v.status === "SD_READY");
    if (ready.length === 0) continue;

    const newest = ready.reduce((best, v) => (v.variantIndex > best.variantIndex ? v : best));
    // displayImageUrl is the light WebP; finalImageUrl is the multi-MB print master.
    const url = newest.displayImageUrl ?? newest.finalImageUrl;
    if (!url) continue;

    const meta = metadataPages.find((p) => p.pageNumber === page.pageNumber);
    const naturalWidth = page.artworkWidth ?? meta?.artworkWidth ?? FALLBACK_BOX.width;
    const naturalHeight = page.artworkHeight ?? meta?.artworkHeight ?? FALLBACK_BOX.height;
    const ratio = naturalWidth / naturalHeight;

    const width = ratio >= 1 ? IMAGE_BOX_LONG_EDGE_PX : Math.round(IMAGE_BOX_LONG_EDGE_PX * ratio);
    const height = ratio >= 1 ? Math.round(IMAGE_BOX_LONG_EDGE_PX / ratio) : IMAGE_BOX_LONG_EDGE_PX;

    return { url, width, height, isGenerated: true };
  }

  const thumbnailUrl = snapshot.comic.coverThumbnailUrls?.[0];
  return thumbnailUrl ? { url: thumbnailUrl, ...FALLBACK_BOX, isGenerated: false } : null;
}

export default function OrderSummary({ snapshot }: OrderSummaryProps) {
  const { data: comicDetail } = usePublicComic(snapshot.comicId);
  const { selectedCountry, getCurrencySymbol } = useCountryStore();

  if (!comicDetail) return null;

  const summaryImage = resolveSummaryImage(snapshot, comicDetail.pages);

  // Find pricing rule
  const countryPricing = comicDetail.pricingRules.filter(
    (rule) => rule.country.code === selectedCountry?.code
  );
  
  const pricingRule = countryPricing.find(
    (r) => r.coverType === snapshot.coverType
  );

  const currencySymbol = getCurrencySymbol();
  const price = pricingRule ? pricingRule.price : "N/A";

  // Derived from the RULE, not from `price` above — that falls back to the
  // string "N/A", which would parse to NaN.
  const { mrp, showMrp } = pricingRule
    ? resolveMrp(pricingRule)
    : { mrp: NaN, showMrp: false };

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
      <h2 className="text-xl font-bold text-[#3F3C95] mb-6">Order Summary</h2>
      
      <div className="flex gap-4">
        {summaryImage && (
          <div
            className="relative rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-200"
            style={{ width: summaryImage.width, height: summaryImage.height }}
          >
            <Image
              src={summaryImage.url}
              alt={
                summaryImage.isGenerated
                  ? `${comicDetail.title} — personalized for ${snapshot.childName || "your child"}`
                  : "Comic Cover"
              }
              fill
              // The generated box already matches the page's ratio, so contain
              // shows the whole page. The fallback thumbnail keeps its old crop.
              className={summaryImage.isGenerated ? "object-contain" : "object-cover"}
              sizes={`${summaryImage.width}px`}
            />
          </div>
        )}
        
        {/* min-w-0 is load-bearing: a flex item's min-width defaults to `auto`,
            so without it this column refuses to shrink below its content and the
            price row below punches straight through the card's padding. */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h3 className="font-bold text-gray-800 text-lg leading-tight break-words">{comicDetail.title}</h3>
            <p className="text-gray-500 text-sm mt-1">
              Personalized for <span className="font-semibold text-gray-700">{snapshot.childName || "your child"}</span>
            </p>
          </div>
          
          {/* flex-wrap is the actual overflow guard: when the badge and the
              price cannot sit side by side — a long currency, a four-figure
              MRP, a narrow phone — the price group drops to its own line
              instead of spilling out of the card. */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mt-4">
            <span className="px-3 py-1 bg-[#F8E7D2] text-[#914A8C] text-xs font-bold rounded-full uppercase shrink-0">
              {snapshot.coverType}
            </span>
            <div className="flex items-baseline gap-2 shrink-0">
              {showMrp && (
                <span className="text-sm sm:text-base font-semibold text-gray-400 line-through whitespace-nowrap">
                  {currencySymbol}{mrp.toLocaleString("en-IN")}
                </span>
              )}
              {/* Steps down a size on narrow viewports, where this is the
                  widest thing in the row. */}
              <span className="text-xl sm:text-2xl font-black text-[#3F3C95] whitespace-nowrap">
                {currencySymbol}{price}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-center text-gray-500 font-medium">
          Your order details cannot be changed after payment.
        </p>
      </div>
    </div>
  );
}
