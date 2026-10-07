"use client";

import Image from "next/image";
import Link from "next/link";
import { chauPhilomeneOne } from "@/app/fonts";
import { BANNER_HEADING_SIZE } from "@/components/home/bannerHeading";
import { useLatestPublicComics } from "@/hooks/usePublicComics";
import StoryCard from "@/components/home/StoryCard";

interface ExploreMoreBooksProps {
  comicId: string;
}

export default function ExploreMoreBooks({ comicId }: ExploreMoreBooksProps) {
  // Three, not four — and it has to match the grid's column count below.
  // StoryCard caps at max-w-[380px] but has no minimum, so it shrinks to fill
  // whatever column it is given: four columns inside max-w-7xl work out to
  // ~272px each, which is why these cards looked smaller than the homepage's.
  // Three columns give ~373px, landing at the cap.
  const { data: comics, isLoading } = useLatestPublicComics(comicId, 3);

  if (!isLoading && (!comics || comics.length === 0)) {
    return null;
  }

  return (
    <>
      {/* ===== Purple Wave Banner ===== */}
      <div className="relative w-full overflow-visible">
        {/* SVG Background */}
        <svg
          viewBox="0 0 1728 311"
          className="w-full block h-[80px] sm:h-[120px] md:h-[160px] lg:h-[200px]"
          preserveAspectRatio="none"
        >
          <path
            fill="#914A8C"
            d="M66.9068 29.469L-1 0V297L60.6428 263.852C89.7598 248.195 122.304 240 155.364 240H278.89H416.829H535.5H698.224H836.5H1016.5H1151H1331.5H1500.38C1574.97 240 1648.08 260.856 1711.44 300.213L1728 310.5V0L1650.63 31.3555C1626.77 41.0275 1601.26 46 1575.51 46H1331.5H1151H1016.5H836.5H698.224H535.5H416.829H278.89H146.525C119.134 46 92.0343 40.3734 66.9068 29.469Z"
          />
        </svg>

        {/* Heading + explorer form ONE row, centred as a group — the same
            structure as "Choose Your Story" + dragon on the homepage, so the
            two can never overlap however large the heading gets.

            Sizes match that banner exactly:
              - heading: the shared BANNER_HEADING_SIZE scale;
              - explorer: the dragon's rendered HEIGHT at every breakpoint.
                DragonImg.png is 669x374, so the dragon stands 78 / 162 / 212 /
                257 / 291px tall at its 140 / 290 / 380 / 460 / 520px widths.
                Explore-boy.png is 1080x540 (2:1), so the same heights need
                widths of 156 / 324 / 424 / 514 / 582px.

            Like that banner, the row spans only the band's flat strip (viewBox
            y 46→240 of 311 → 14.8% top / 22.8% bottom) so the heading centres
            on the purple, not on the flared SVG box. */}
        <div className="absolute inset-x-0 top-[14.8%] bottom-[22.8%] max-w-7xl mx-auto w-full px-4 sm:px-8 flex justify-center gap-2 sm:gap-4 xl:gap-8 pointer-events-none">
          <h2
            className={`
              ${chauPhilomeneOne.className}
              self-center
              shrink-0
              whitespace-nowrap
              text-white
              uppercase
              ${BANNER_HEADING_SIZE}
              z-30
              relative
            `}
          >
            Explore More Books
          </h2>

          {/* Explorer slot — the image's width, the row's full height. It may
              shrink (min-w-0) on a very narrow phone rather than push the page
              sideways; the heading never does.

              Vertically CENTRED on the band's flat strip (top-1/2 +
              -translate-y-1/2), so she sits level with the heading. Taller
              than the strip, she overhangs it equally above and below:
                above the band's top:    2 / 26 / 32 / 37 / 53px
                below the band's bottom: 0 / 16 / 20 / 20 / 37px
              Both fit inside the neighbouring sections' padding (≥ 64px above
              — the FAQ section's pb-20, or the info section's lg:py-16 when a
              comic has no FAQs — and the cards' pt-10 / md:pt-16 below), so no
              extra margin is needed. */}
          <div className="relative min-w-0 w-[156px] sm:w-[324px] md:w-[424px] lg:w-[514px] xl:w-[582px]">
            <Image
              src="/assets/home_page/Explore-boy.png"
              alt="Explorer Boy"
              width={1080}
              height={540}
              priority
              className="
                absolute
                left-0
                top-1/2
                -translate-y-1/2
                w-full
                h-auto
                pointer-events-none
                select-none
                z-20
              "
            />
          </div>
        </div>
      </div>

      {/* ===== Cards Grid ===== */}
      <section className="bg-[#F8E7D2] pb-20 pt-10 md:pt-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[#555555] font-medium">Loading stories...</p>
            </div>
          ) : (
            <>
              {/* Same column counts as the homepage grid in ChooseStory, so a
                  card renders at an identical size on both pages. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-12">
                {comics.map((comic) => (
                  <StoryCard key={comic.id} comic={comic} />
                ))}
              </div>

              {/* Inside the loaded branch on purpose — a call to action under a
                  set of skeletons invites a click on nothing. */}
              <div className="flex justify-center">
                <Link
                  href="/comic"
                  className="
                    inline-flex items-center justify-center
                    px-10 py-3
                    bg-gradient-to-b from-[#3F3C95] to-[#2B2882]
                    text-white text-xs md:text-sm font-extrabold
                    uppercase tracking-wider
                    rounded-full
                    border-b-[4px] border-[#C8942A]
                    shadow-[0_4px_10px_rgba(63,60,149,0.3)]
                    hover:brightness-110
                    active:translate-y-[2px] active:border-b-[2px]
                    transition-all
                  "
                >
                  Explore All Books
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
