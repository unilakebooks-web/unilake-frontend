"use client";

import { useState, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { PublicComicListItem } from "@/app/types/comic";
import { CoverType } from "@/app/types/comic";
import { useCountryStore } from "@/stores/useCountryStore";
import { hankenGrotesk, poppins, protestStrike } from "@/app/fonts";
import { resolveMrp } from "@/lib/utils";
import { formatAgeRange } from "@/lib/comicTags";
import ComicQuickViewModal from "@/components/home/ComicQuickViewModal";

interface StoryCardProps {
  comic: PublicComicListItem;
}

export default function StoryCard({ comic }: StoryCardProps) {
  // Personalise opens a quick-view popup; the popup's own button is what
  // navigates to /comic/[id].
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const getCurrencySymbol = useCountryStore((state) => state.getCurrencySymbol);

  // Fallback if no images are present
  const images = comic.coverThumbnailUrls.length > 0 
    ? comic.coverThumbnailUrls 
    : ["/assets/home_page/bookCover1.png"]; // Default fallback image

  // How many lines the title actually wrapped to (1 or 2). The title and
  // description share one fixed-height block, so a one-line title frees room
  // for a third line of description instead of leaving a blank gap. CSS can't
  // tell how many lines text wrapped to, so it is measured.
  //
  // ResizeObserver rather than a one-off read: the line count changes when the
  // card resizes with its grid column, and when the web font finishes loading
  // and the title re-wraps. Both change the title's height, which is exactly
  // what the observer reports. Starts at 2 — the conservative value, and what
  // the server render uses before anything can be measured.
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [titleLines, setTitleLines] = useState(2);

  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      if (!lineHeight) return;
      setTitleLines(Math.round(el.getBoundingClientRect().height / lineHeight));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Hover shows the second cover and holds it — no cycling through the rest.
  // A comic with a single cover simply keeps showing it.
  const handleMouseEnter = () => {
    if (images.length > 1) setCurrentImageIndex(1);
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  // One range across all the comic's age groups — [3-5, 6-8] shows "AGE: 3-8".
  const ageLabel = formatAgeRange(comic.ageGroups) ?? "ALL AGES";

  // First theme (alphabetical, as the API sends them) plus a "+N" count for
  // the rest; the quick-view popup lists them all. The tooltip names every one.
  const firstTheme = comic.themes[0]?.name ?? "General";
  const extraThemeCount = Math.max(comic.themes.length - 1, 0);
  const allThemeNames =
    comic.themes.length > 0 ? comic.themes.map((t) => t.name).join(", ") : firstTheme;
  const pages = comic.pageCount || 24;

  // Extract pricing info
  const pricing = comic.pricingRules.find(
    (p) => p.country.code === selectedCountry?.code && p.coverType === CoverType.SOFTCOVER
  );
  
  // MRP is admin-entered per country and cover type. It used to be faked here
  // as price * 1.3; it is now a real column on the pricing rule.
  const { price: basePrice, mrp, showMrp } = pricing
    ? resolveMrp(pricing)
    : { price: 0, mrp: NaN, showMrp: false };
  const currencySymbol = getCurrencySymbol();

  // SIZING — everything inside the white body is sized in `cqw`, a percentage
  // of THIS card's width (the root below is the query container). The card
  // shrinks with its grid column (~272px on a phone / two-column tablet, 380px
  // at most), while screen breakpoints only know the viewport — which is how
  // text used to end up too big for the card at in-between widths. Sized off
  // the card itself, the layout is identical at every width, just scaled.
  //
  // Reference width is 380px, where 1cqw = 3.8px; the px values in the
  // comments below are what each size resolves to there.
  //
  // Vertical budget: the body starts at 46% of the card's height, and the
  // Personalise button must end by ~86% — level with the page-curl drawn into
  // card.svg — or it drops into the shield's taper. That is ~227px at 380 wide.
  // Current stack: tags 18 + 6, title+description block 92.3 + 7.6, price
  // 26.6 + 10, button 47 = ~208px. Adding height to any row eats into the
  // remaining ~19px of slack; check this sum first.
  return (
    <div
      className={`
        @container
        relative
        w-full
        max-w-[330px] sm:max-w-[355px] md:max-w-[380px]
        mx-auto
        aspect-[427/623]
        overflow-visible
        transition-all duration-300 hover:-translate-y-2
        group
        ${hankenGrotesk.className}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background SVG Frame (card.svg includes shadow & body) */}
      <Image
        src="/assets/card.svg"
        alt="Story Card Background"
        fill
        className="pointer-events-none select-none z-0"
        priority
      />

      {/* Book Cover — fills the blackboard, leaving an equal 10px strip of
          board on all four sides.

          Geometry, measured from the raster inside card.svg and converted to
          percentages of this card box (card is 427×623, so 1% of width ≠ 1% of
          height — a 10px margin is a different % on each axis):
            board inner area   left 9.20%  right 90.80%  top 4.15%  bottom 44.49%
            margin             10px at 380 wide = 2.63% of card WIDTH
                               = 1.80% of card HEIGHT
            box                left 11.83%  width 76.33%
                               top 5.96%    height 36.73%
          At 380 wide that is ~290×204px, about 1.42:1.

          The box's shape is set by the board, not by the image: a 16:9 box
          10px from the board's top and bottom would be ~363px wide, wider than
          the board itself. So covers are centre-cropped (object-cover) to fill
          it: a 16:9 cover loses ~10% off each side, a square cover ~15% off its
          top and bottom.

          The bottom edge ends a few px below the tops of the duster and chalk
          box, so the image slides BEHIND them — see the chalk-tray overlay
          further down. */}
      <div
        className="absolute z-10"
        style={{ left: "11.83%", top: "5.96%", width: "76.33%", height: "36.73%" }}
      >
        {/* Image, clipped to softly rounded corners. */}
        <div className="absolute inset-0 overflow-hidden rounded-[1.6cqw]">
          <Image
            src={images[currentImageIndex]}
            alt={comic.title}
            fill
            // The box is ~76% of a card that is at most 380px wide.
            sizes="(max-width: 640px) 80vw, 300px"
            className="object-cover"
            priority
          />

          {/* Sunk into the board: a dark inner shadow on every edge, so the
              image reads as drawn IN the slate rather than stuck on top. */}
          <div className="absolute inset-0 rounded-[1.6cqw] shadow-[inset_0_0_3cqw_rgba(0,0,0,0.55)] pointer-events-none" />

          {/* A faint film of chalk dust over the picture, like everything
              else on a used blackboard. */}
          <div className="absolute inset-0 bg-white/[0.04] mix-blend-screen pointer-events-none" />
        </div>

        {/* Bestseller tag — pinned over the cover's top-left corner rather than
            added to the tag row below, so it costs none of the white body's
            vertical budget (see the sizing note above). Same type size as the
            pills; brand yellow + indigo, matching the yellow CTA buttons. */}
        {comic.isBestseller && (
          <span className="absolute top-[2.1cqw] left-[2.1cqw] z-10 whitespace-nowrap text-[clamp(7px,2.1cqw,8px)] leading-[1.5] font-extrabold text-[#3F3C95] bg-[#FFD54A] border border-[#3F3C95]/30 rounded-full px-[2.1cqw] py-[0.53cqw] uppercase tracking-wide shadow-sm pointer-events-none">
            ★ Bestseller
          </span>
        )}
      </div>

      {/* Duster + chalk box, re-drawn IN FRONT of the cover.
          card-chalk-tray.png is cut from card.svg's own artwork: the same
          pixels at the same position on a transparent canvas of the same 427:623
          size, rendered at 2×. Laid over the card with `fill` exactly like
          card.svg, it lines up pixel-for-pixel, so the only visible effect is
          that the cover's bottom edge tucks behind the tray items. If card.svg
          ever changes, this file must be regenerated from it. */}
      <Image
        src="/assets/card-chalk-tray.png"
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 380px"
        className="pointer-events-none select-none z-20"
        priority
      />

      {/* White Body Container */}
      <div
        className="
          absolute
          left-[13.5%]
          top-[46%]
          w-[73%]
          h-[52%]
          z-10
          flex flex-col
          gap-0
        "
      >
        {/* Tags — one line, never wrapped.
            `flex-nowrap` because a wrapped second row would add height here and
            push everything below it down, which is the same class of bug the
            description's fixed height exists to prevent.
            Age and pages are short and fixed, so they never give way. The theme
            name is admin-entered and unbounded, so it is the one that truncates:
            `min-w-0` is what actually lets it shrink — a flex item will not go
            below its content width without it, and `truncate` alone would do
            nothing here. */}
        <div className="flex items-center gap-[1.6cqw] flex-nowrap mb-[1.6cqw]">
          {/* Pills: 8px at 380 wide (2.1cqw), floored at 7px — scaled purely
              proportionally they would hit ~5.8px on the narrowest card and
              stop being readable. The 1px of extra height that floor costs on
              a small card is absorbed by the budget's slack. */}
          {/* Age Pill */}
          <span className="shrink-0 whitespace-nowrap text-[clamp(7px,2.1cqw,8px)] leading-[1.5] font-extrabold text-[#5C53C6] bg-[#EBE7FF] border border-[#D6CFFF]/50 rounded-full px-[2.1cqw] py-[0.53cqw] uppercase tracking-wide">
            AGE: {ageLabel}
          </span>

          {/* Category Pill — the only one allowed to shrink. Only the theme
              NAME truncates: the "+N" sits outside the truncating span so it
              stays visible however long the first theme's name is. */}
          <span
            title={allThemeNames}
            className="min-w-0 flex items-center gap-[0.8cqw] text-[clamp(7px,2.1cqw,8px)] leading-[1.5] font-extrabold text-[#1F8A60] bg-[#E3F8EE] border border-[#CCEFE2]/50 rounded-full px-[2.1cqw] py-[0.53cqw] uppercase tracking-wide"
          >
            <span className="min-w-0 truncate">{firstTheme}</span>
            {extraThemeCount > 0 && (
              <span className="shrink-0">+{extraThemeCount}</span>
            )}
          </span>

          {/* Pages Pill */}
          <span className="shrink-0 whitespace-nowrap text-[clamp(7px,2.1cqw,8px)] leading-[1.5] font-extrabold text-[#B04C1C] bg-[#FFF0E6] border border-[#FFE1D1]/50 rounded-full px-[2.1cqw] py-[0.53cqw] uppercase tracking-wide">
            {pages} PAGES
          </span>
        </div>

        {/* Title + description — one block with a FIXED height, so the price
            and button below sit at the same height on every card in a row.
            The height is the worst case, a two-line title plus a two-line
            description, at 380 wide:
              title 2 × 20px × 1.25   = 50px    (13.15cqw)
              gap                     = 3.8px  (1cqw)
              description 2 × 14px × 1.375 = 38.5px (10.12cqw)
                                      = 92.3px (24.3cqw)
            Inside it the description follows the title directly — no reserved
            gap. With a one-line title it may use a third line instead:
            25 + 3.8 + 57.75 = 86.55px, still inside the block. Change a font
            size or line-height here and this sum must be redone. */}
        <div className="h-[24.3cqw] mb-[2cqw] overflow-hidden">
          {/* 20px at 380 wide. At most two lines, then an ellipsis; the full
              title is in the tooltip. */}
          <h3
            ref={titleRef}
            title={comic.title}
            className={`${hankenGrotesk.className} text-[5.26cqw] font-bold text-[#000000] uppercase leading-[1.25] tracking-normal line-clamp-2 break-words mb-[1cqw]`}
          >
            {comic.title}
          </h3>

          {/* 14px at 380 wide. Three lines when the title took one, else two. */}
          <p
            className={`${poppins.className} text-[3.68cqw] font-normal text-[#000000]/[0.74] leading-snug ${titleLines === 1 ? "line-clamp-3" : "line-clamp-2"}`}
          >
            {comic.description || "A personalized storybook adventure for your child."}
          </p>
        </div>

        {/* Price row — discounted price, then the struck-through MRP beside it
            on the same line, sharing a baseline (24px and 18px at 380 wide).
            The row has a fixed height (7cqw), identical in both branches, so a
            card without a discount — or without pricing at all — never shifts
            the button relative to its neighbours. */}
        {pricing ? (
          <div className="flex items-baseline gap-[2.1cqw] whitespace-nowrap h-[7cqw] mb-[2.6cqw]">
            <span className={`${protestStrike.className} text-[6.3cqw] font-normal text-[#000000] leading-none uppercase`}>
              {currencySymbol} {basePrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
            {/* Hidden when the comic has no MRP set, or is sold at full price. */}
            {showMrp && (
              <span className={`${protestStrike.className} text-[4.7cqw] font-normal text-[#6B7280] leading-none line-through uppercase`}>
                {currencySymbol} {mrp.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center h-[7cqw] mb-[2.6cqw]">
            {/* 10px at 380 wide; two lines at leading-tight still fit 7cqw. */}
            <span className="text-[2.63cqw] font-bold text-red-500 leading-tight line-clamp-2">
              Not available for shipping in {selectedCountry?.name || "this country"}
            </span>
          </div>
        )}

        {/* Personalise Button.
            ⚠️ Do NOT add `mt-auto` here. It looks like the right way to stop the
            button moving, but this flex container is `top-[46%] h-[52%]` — it
            runs to 98% of the card, while the shield shape in card.svg tapers
            and ends well above that. Pushing the button to the container's
            bottom drops it into the empty space BELOW the visible card.
            The button does not need pinning: everything above it is already a
            fixed height — the tag row cannot wrap, and the title, description
            and price rows each reserve an explicit height. So the button lands
            at the same place on every card by simply flowing after them.
            Text is 18px at 380 wide; see the sizing note at the top. */}
        <div className="flex justify-center w-full">
          <button
            onClick={() => setIsQuickViewOpen(true)}
            disabled={!pricing}
            className={`
              w-[80%]
              bg-gradient-to-b from-[#3F3C95] to-[#2B2882]
              text-white
              text-[4.74cqw] leading-[1.5] font-extrabold
              uppercase tracking-wider
              py-[2.1cqw]
              rounded-full
              border-b-[4px] border-[#C8942A]
              shadow-[0_4px_10px_rgba(63,60,149,0.3)]
              transition-all
              text-center
              ${
                !pricing
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : "hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] cursor-pointer"
              }
            `}
          >
            Personalise
          </button>
        </div>
      </div>

      {/* Portalled to <body>, so the card's container sizing and hover
          transform do not reach it. */}
      <ComicQuickViewModal
        comic={comic}
        open={isQuickViewOpen}
        onOpenChange={setIsQuickViewOpen}
        coverImage={images[0]}
        pages={pages}
        pricing={
          pricing
            ? { price: basePrice, mrp, showMrp, currencySymbol }
            : null
        }
        countryName={selectedCountry?.name}
      />
    </div>
  );
}