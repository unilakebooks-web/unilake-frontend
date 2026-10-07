"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { PublicComicListItem } from "@/app/types/comic";
import { hankenGrotesk, poppins, protestStrike } from "@/app/fonts";
import { formatAgeGroup, formatGender } from "@/lib/comicTags";

/** Price as StoryCard already resolved it — null when not sold in the country. */
export interface QuickViewPrice {
  price: number;
  mrp: number;
  showMrp: boolean;
  currencySymbol: string;
}

interface ComicQuickViewModalProps {
  comic: PublicComicListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The card's first cover, fallback included. Only one cover is shown here. */
  coverImage: string;
  pages: number;
  pricing: QuickViewPrice | null;
  countryName: string | undefined;
}

const PILL =
  "whitespace-nowrap text-[11px] leading-[1.5] font-extrabold rounded-full px-3 py-1 uppercase tracking-wide border";

const PERSONALISE_BUTTON = `
  bg-gradient-to-b from-[#3F3C95] to-[#2B2882]
  text-white text-base sm:text-lg leading-[1.5] font-extrabold uppercase tracking-wider
  px-8 py-2.5 rounded-full
  border-b-[4px] border-[#C8942A]
  shadow-[0_4px_10px_rgba(63,60,149,0.3)]
  transition-all
`;

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Quick look at a comic, opened from StoryCard's Personalise button.
 *
 * Shows what the card has to clip — the full description in particular — and
 * hands off to /comic/[id] for the actual personalisation form. Everything here
 * comes from the catalogue list item the card already holds, so opening it
 * costs no request.
 *
 * The price is passed in from the card rather than recomputed, so the card and
 * the popup can never disagree. Age groups, themes and genders are listed in
 * full here — every value gets its own pill, unlike the card's condensed row.
 */
export default function ComicQuickViewModal({
  comic,
  open,
  onOpenChange,
  coverImage,
  pages,
  pricing,
  countryName,
}: ComicQuickViewModalProps) {
  const router = useRouter();

  const personalise = () => router.push(`/comic/${comic.id}`);
  const buttonState = !pricing
    ? "opacity-50 cursor-not-allowed"
    : "hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] cursor-pointer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* LAYOUT — a flex column, not the shared dialog's default grid.
          The grid's single `auto` column grows to its widest child, which on a
          phone made rows wider than the popup and clipped them on the right.
          As a flex column each child is bounded by the popup's width instead.

          The popup itself never scrolls (overflow-hidden). Only the middle
          region does, which is what lets the close button and — on phones —
          the Personalise footer stay put while a long description scrolls.

          Width: the shared base keeps a 1rem gutter each side on phones
          (max-w-[calc(100%-2rem)]); sm:max-w-3xl caps it on larger screens.
          dvh rather than vh so mobile browser toolbars don't push the footer
          off-screen. */}
      <DialogContent
        showCloseButton={false}
        className={`${hankenGrotesk.className} flex flex-col gap-0 p-0 overflow-hidden sm:max-w-3xl max-h-[90dvh] rounded-[24px] sm:rounded-[28px] border border-[#3F3C95]/15 bg-white shadow-xl`}
      >
        {/* Own close button rather than the shared one: it sits over the cover
            on phones, so it needs a solid backing to stay visible on dark art. */}
        <DialogClose
          aria-label="Close"
          className="absolute top-3 right-3 z-20 flex items-center justify-center size-9 rounded-full bg-white/95 text-[#3F3C95] shadow-md ring-1 ring-[#3F3C95]/10 hover:bg-white transition-colors cursor-pointer"
        >
          <XIcon className="size-5" />
        </DialogClose>

        {/* ── Scrollable body ──────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-7">
          <div className="flex flex-col md:flex-row gap-5 md:gap-8 min-w-0">
            {/* ── Cover ──────────────────────────────────────────────── */}
            <div className="w-full md:w-[45%] shrink-0 min-w-0">
              {/* object-contain so the whole cover shows. The card crops covers
                  to fit its blackboard; here the point is to see all of it. */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#F8E7D2]">
                <Image
                  src={coverImage}
                  alt={comic.title}
                  fill
                  sizes="(max-width: 768px) 92vw, 340px"
                  className="object-contain"
                />
                {comic.isBestseller && (
                  <span className="absolute top-3 left-3 whitespace-nowrap text-[11px] leading-[1.5] font-extrabold text-[#3F3C95] bg-[#FFD54A] border border-[#3F3C95]/30 rounded-full px-3 py-1 uppercase tracking-wide shadow-sm">
                    ★ Bestseller
                  </span>
                )}
              </div>
            </div>

            {/* ── Details ────────────────────────────────────────────── */}
            <div className="flex flex-col min-w-0 flex-1">
              {/* Tags wrap here — unlike the card there is no fixed height to
                  protect, so every age group, theme and gender gets its own
                  pill and long theme names show in full. The right padding on
                  md+ clears the close button, which sits above this column
                  there; on phones it sits over the cover instead. */}
              <div className="flex flex-wrap items-center gap-2 mb-3 md:pr-10">
                {comic.ageGroups.length > 0 ? (
                  comic.ageGroups.map((ageGroup) => (
                    <span key={ageGroup} className={`${PILL} text-[#5C53C6] bg-[#EBE7FF] border-[#D6CFFF]/50`}>
                      Age: {formatAgeGroup(ageGroup)}
                    </span>
                  ))
                ) : (
                  <span className={`${PILL} text-[#5C53C6] bg-[#EBE7FF] border-[#D6CFFF]/50`}>
                    All Ages
                  </span>
                )}
                {comic.themes.length > 0 ? (
                  comic.themes.map((theme) => (
                    <span key={theme.id} className={`${PILL} text-[#1F8A60] bg-[#E3F8EE] border-[#CCEFE2]/50`}>
                      {theme.name}
                    </span>
                  ))
                ) : (
                  <span className={`${PILL} text-[#1F8A60] bg-[#E3F8EE] border-[#CCEFE2]/50`}>
                    General
                  </span>
                )}
                <span className={`${PILL} text-[#B04C1C] bg-[#FFF0E6] border-[#FFE1D1]/50`}>
                  {pages} Pages
                </span>
                {comic.genderTags.map((gender) => (
                  <span key={gender} className={`${PILL} text-[#914A8C] bg-[#F7E8F5] border-[#EBCFE7]/50`}>
                    {formatGender(gender)}
                  </span>
                ))}
              </div>

              {/* DialogTitle labels the dialog for assistive tech. */}
              <DialogTitle
                className={`${hankenGrotesk.className} text-xl sm:text-2xl md:text-[26px] font-bold text-black uppercase leading-tight break-words`}
              >
                {comic.title}
              </DialogTitle>

              {pricing ? (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-3">
                  <span className={`${protestStrike.className} text-2xl sm:text-[28px] text-black leading-none`}>
                    {pricing.currencySymbol} {formatAmount(pricing.price)}
                  </span>
                  {pricing.showMrp && (
                    <span className={`${protestStrike.className} text-lg sm:text-xl text-[#6B7280] leading-none line-through`}>
                      {pricing.currencySymbol} {formatAmount(pricing.mrp)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm font-bold text-red-500">
                  Not available for shipping in {countryName || "this country"}
                </p>
              )}

              <div className="h-px bg-[#3F3C95]/10 my-4" />

              {/* Full, unclamped description. whitespace-pre-wrap keeps any line
                  breaks the admin typed. Plain text — never rendered as HTML. */}
              <DialogDescription
                className={`${poppins.className} text-sm sm:text-[15px] leading-relaxed text-black/75 whitespace-pre-wrap break-words`}
              >
                {comic.description || "A personalized storybook adventure for your child."}
              </DialogDescription>

              {/* md and up: the button follows the description inside the
                  details column. Below md it lives in the pinned footer
                  instead — the two are never visible at the same time. */}
              <button
                type="button"
                onClick={personalise}
                disabled={!pricing}
                className={`hidden md:block mt-6 min-w-[220px] self-start ${PERSONALISE_BUTTON} ${buttonState}`}
              >
                Personalise
              </button>
            </div>
          </div>
        </div>

        {/* ── Pinned footer (phones / small tablets only) ──────────────
            shrink-0 keeps it out of the scroll region, so the button is
            always on screen however long the description is. */}
        <div className="md:hidden shrink-0 border-t border-[#3F3C95]/10 bg-white px-4 sm:px-6 pt-3 pb-4">
          <button
            type="button"
            onClick={personalise}
            disabled={!pricing}
            className={`w-full ${PERSONALISE_BUTTON} ${buttonState}`}
          >
            Personalise
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
