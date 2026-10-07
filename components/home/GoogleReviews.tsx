"use client";

import { useState } from "react";
import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import { BANNER_HEADING_SIZE } from "@/components/home/bannerHeading";
import { usePublicGoogleReviews } from "@/hooks/usePublicContent";
import { MAX_RATING } from "@/app/types/googleReview";

const INITIAL_VISIBLE_COUNT = 3;

export default function GoogleReviews() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const { data: allReviews = [], isLoading } = usePublicGoogleReviews();

  const handleLoadMore = () => {
    setVisibleCount(allReviews.length);
  };

  const visibleReviews = allReviews.slice(0, visibleCount);

  // Nothing to show — render nothing at all rather than the purple
  // "Excellent On Google" banner sitting above an empty grid. The banner is
  // part of this component, so hiding the section hides both.
  //
  // The same branch covers the loading pass: this section is well below the
  // fold, so appearing once loaded beats reserving space with a skeleton.
  if (isLoading || allReviews.length === 0) return null;

  return (
    <>
      {/* ===== Symmetrical Flared Purple Banner ===== */}
      <div className="relative w-full overflow-visible mt-20 lg:mt-32">
        {/* Flared wave SVG */}
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

        {/* UFO + title form ONE row centered as a group (same approach as
            the dragon in ChooseStory). The UFO slot sits directly before
            the title, so the beam's tip lands on the "E" at every width. */}
        {/* Leftward nudge is capped per breakpoint by the spare room beside
            the group, so the UFO never gets clipped at the viewport edge.
            None on mobile — the row already nearly fills the screen there.
            Vertically the row spans only the band's flat strip — viewBox y
            46→240 of 311, i.e. 14.8% from the top and 22.8% from the bottom.
            The flares make the SVG box taller below the strip than above it,
            so centering on the whole box sat the title visibly low. The UFO
            slot stretches to this same row, so the beam follows the title.
            Title sizes are capped per breakpoint so title + UFO still fit
            the screen width (the UFO takes most of it). */}
        <div className="absolute inset-x-0 top-[14.8%] bottom-[22.8%] max-w-7xl mx-auto w-full px-4 sm:px-8 flex justify-center pointer-events-none sm:-translate-x-4 md:-translate-x-6 lg:-translate-x-8 xl:-translate-x-12 2xl:-translate-x-24">
          {/* UFO slot — full band height (flex stretch), UFO width.
              Measured from ufoImg.png: the beam tip is 86.4% down the image
              and 2.9% short of its right edge (transparent margin). Centering
              that tip on the band and nudging the image right by the margin
              puts the beam level with, and touching, the title. */}
          <div className="relative shrink-0 w-[150px] sm:w-[320px] md:w-[400px] lg:w-[540px] xl:w-[700px]">
            <Image
              src="/assets/home_page/ufoImg.png"
              alt="5 Star UFO"
              width={822}
              height={301}
              priority
              className="
                absolute
                left-0
                w-full
                h-auto
                top-1/2
                translate-x-[2.9%]
                translate-y-[-86.4%]
                select-none
                pointer-events-none
              "
            />
          </div>

          <h2
            className={`
              ${chauPhilomeneOne.className}
              self-center
              shrink-0
              whitespace-nowrap
              text-white
              ${BANNER_HEADING_SIZE}
              z-30
              relative
            `}
          >
            Excellent On Google
          </h2>
        </div>
      </div>

      {/* ===== Reviews Grid Section ===== */}
      <section className="bg-[#F8E7D2] pb-24 pt-14 md:pt-20 relative">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          
          {/* 3-Column Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-10 lg:gap-x-12 pb-16">
            {visibleReviews.map((review) => (
              <div key={review.id} className="flex justify-center">
                {/* Wobbly outline bubble card */}
                <div
                  className="
                    relative
                    w-full
                    max-w-[340px]
                    bg-white
                    border-[3px] border-black
                    rounded-tr-[45px] rounded-bl-[45px]
                    rounded-tl-[12px] rounded-br-[12px]
                    pt-10 pb-8 px-8
                    shadow-[5px_5px_0px_rgba(0,0,0,0.15)]
                    transition-all duration-300
                    hover:scale-[1.02]
                    hover:shadow-[8px_8px_0px_rgba(0,0,0,0.2)]
                  "
                >
                  {/* Circle baby avatar mounted on the top-left */}
                  <div
                    className="
                      absolute
                      -top-6
                      -left-6
                      w-16
                      h-16
                      rounded-full
                      border-[3px] border-black
                      overflow-hidden
                      bg-white
                      shadow-md
                      z-20
                    "
                  >
                    <Image
                      src={review.imageUrl}
                      alt={review.customerName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  {/* Stars Row — fills `rating` stars and greys out the rest.
                      Previously hardcoded to five filled stars, which would
                      have shown every review as 5/5 regardless of its rating. */}
                  <div
                    className="flex items-center gap-0.5 mb-4 pl-6"
                    aria-label={`${review.rating} out of ${MAX_RATING} stars`}
                  >
                    {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map(
                      (star) => (
                        <svg
                          key={star}
                          className={`w-6 h-6 fill-current ${
                            star <= review.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      )
                    )}
                  </div>

                  {/* Review Text */}
                  <p className={`${hankenGrotesk.className} text-[#333333] text-sm sm:text-base font-medium leading-relaxed mb-5`}>
                    {review.reviewText}
                  </p>

                  {/* Author Name */}
                  <h4 className={`${hankenGrotesk.className} text-[#000000] font-extrabold text-base sm:text-lg`}>
                    {review.customerName}
                  </h4>

                  {/* Solid Black Quotation Mark in bottom-right */}
                  <div
                    className="
                      absolute
                      -bottom-5
                      -right-4
                      w-12
                      h-12
                      bg-black
                      rounded-full
                      flex items-center justify-center
                      shadow-md
                      z-20
                    "
                  >
                    <span className="text-white text-3xl font-serif leading-none mt-2 select-none">
                      ”
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {visibleCount < allReviews.length && (
            <div className="flex justify-center">
              <button
                onClick={handleLoadMore}
                className="
                  bg-[#3F3C95]
                  text-white
                  px-9
                  py-3
                  rounded-full
                  font-bold
                  uppercase
                  shadow-[0_4px_0_#F26A2E]
                  hover:scale-105
                  active:translate-y-[2px]
                  active:shadow-[0_2px_0_#F26A2E]
                  transition-all duration-200
                  cursor-pointer
                "
              >
                Load More
              </button>
            </div>
          )}

        </div>
      </section>
    </>
  );
}
