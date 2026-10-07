"use client";

import { useState } from "react";
import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import StoryFilters from "@/components/home/StoryFilters";
import StoryCard from "@/components/home/StoryCard";
import { BANNER_HEADING_SIZE } from "@/components/home/bannerHeading";
import { usePublicComics } from "@/hooks/usePublicComics";
import { Loader2 } from "lucide-react";
import { HowItWorks } from "@/app/types/howItWorks";
import { HowItWorksVideo } from "./HowItWorksVideo";

interface ChooseStoryProps {
  howItWorks: HowItWorks | null;
}

export default function ChooseStory({ howItWorks }: ChooseStoryProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  // An empty list means no filter — that's what each dropdown's "All …" sends.
  const handleFilterChange = (filterId: string, values: string[]) => {
    setSelectedFilters((prev) => ({ ...prev, [filterId]: values }));
  };

  const { data: comics, isLoading, error } = usePublicComics({
    ageGroup: selectedFilters.ageGroup,
    gender: selectedFilters.gender,
    themeId: selectedFilters.themeId,
  });

  return (
    <>
      {/* ===== Purple Wave Banner ===== */}
      <div className="relative w-full overflow-visible mt-20 lg:mt-32">
        {/*
          Single SVG — flared/curves at both ends to match the reference image.
          Path uses cubic beziers for smooth organic S-curve transitions.
        */}
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

        {/* Title + dragon form ONE row that is centered as a group. The
            flame's tip is the very first pixel column of DragonImg.png, so
            placing the dragon's slot directly after the title in the flow
            makes the flame start exactly at the "Y" — at every width, with
            no measuring. Centering the title alone can't work: on wide
            screens title + dragon don't fit to the right of center, so
            the dragon gets pushed back over the text.
            Vertically the row spans only the band's flat strip (viewBox y
            46→240 of 311 → 14.8% top / 22.8% bottom), not the whole SVG box,
            whose flares sit lower and would center the title visibly low.
            The dragon slot stretches to this row, so the flame follows. */}
        <div className="absolute inset-x-0 top-[14.8%] bottom-[22.8%] max-w-7xl mx-auto w-full px-4 sm:px-8 flex justify-center pointer-events-none">
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
            Choose Your Story
          </h2>

          {/* Dragon slot — spans the full band height (flex stretch) and
              matches the dragon's width. The flame's tip sits at 53.6% of
              the image's height (measured from the PNG), so centering that
              line on the band puts the flame level with the title at every
              size, instead of fixed bottom offsets that drift per breakpoint. */}
          <div className="relative shrink-0 w-[140px] sm:w-[290px] md:w-[380px] lg:w-[460px] xl:w-[520px]">
            <Image
              src="/assets/home_page/DragonImg.png"
              alt="Dragon"
              width={669}
              height={374}
              priority
              className="
                absolute
                left-0
                w-full
                h-auto
                top-1/2
                translate-y-[-53.6%]
                pointer-events-none
                select-none
                z-20
              "
            />
          </div>
        </div>
      </div>

      {/* ===== Filters + Cards Grid ===== */}
      <section className="bg-[#F8E7D2]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Filter Pills */}
          <StoryFilters
            selected={selectedFilters}
            onChange={handleFilterChange}
          />

          {/* Cards Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[#914B8C] animate-spin mb-4" />
              <p className="text-[#555555] font-medium">Loading stories...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-red-500 font-medium">Failed to load stories. Please try again.</p>
            </div>
          ) : comics && comics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-16">
              {comics.map((comic) => (
                <StoryCard key={comic.id} comic={comic} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[#555555] font-medium text-lg">No stories found matching your criteria.</p>
              <button
                onClick={() => setSelectedFilters({})}
                className="mt-4 px-6 py-2 bg-white border border-[#914B8C] text-[#914B8C] rounded-full hover:bg-[#FDF9F3] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ===== "How It Works" Section ===== */}
      {howItWorks && (
        <>
          <div className="relative w-full overflow-visible mt-20 lg:mt-32">
            {/*
              Same flared curve SVG to match the Choose Your Story banner.
            */}
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

            {/* Text overlay — centered vertically over the SVG.
                The right padding reserves the robot's footprint (its `right`
                offset + width + a small gap, per breakpoint below), so the
                title is centered in the space left of the robot. Below 1280px
                this container ends at the viewport edge, so the padding equals
                that footprint; above that the container is centered, so the
                reservation shrinks by the side gutter `(100vw - 1280px) / 2`.
                Vertically: centered on the band's flat strip (14.8% top /
                22.8% bottom), not the whole SVG box — see the banner above. */}
            <div className="absolute inset-x-0 top-[14.8%] bottom-[22.8%] flex items-center pointer-events-none">
              <div className="max-w-7xl mx-auto w-full relative flex justify-center pl-8 pr-[186px] sm:pr-[262px] md:pr-[348px] lg:pr-[452px] xl:pr-[max(2rem,calc(536px_-_(100vw_-_1280px)/2))]">
                <h2
                  className={`
                    ${chauPhilomeneOne.className}
                    text-white
                    uppercase
                    ${BANNER_HEADING_SIZE}
                    sm:whitespace-nowrap
                    text-center
                    z-30
                    relative
                  `}
                >
                  How to personalize
                </h2>
              </div>
            </div>

            {/* Kid + Robot — bottom-anchored with the same overhang below the
                band as before, so the extra size grows upward into the
                section's top margin instead of down into the steps below. */}
            <div
              className="
                absolute
                right-0
                sm:right-4
                md:right-8
                lg:right-14
                xl:right-20
                bottom-[-20px]
                sm:bottom-[-16px]
                md:bottom-[-22px]
                lg:bottom-[-28px]
                xl:bottom-[-52px]
                z-30
                pointer-events-none
                select-none
              "
            >
              <Image
                src="/assets/home_page/kidWithRobo.png"
                alt="Kid with Robot"
                width={460}
                height={392}
                priority
                className="
                  w-[170px]
                  sm:w-[230px]
                  md:w-[300px]
                  lg:w-[380px]
                  xl:w-[440px]
                  h-auto
                  object-contain
                "
              />
            </div>
          </div>

          {/* Content Section: Cream Background */}
          <section className="bg-[#F8E7D2] pb-24 pt-10 md:pt-16 relative">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                {/* Left Column: Video Mockup */}
                <div className="relative w-full flex justify-center lg:justify-start">
                  <HowItWorksVideo
                    videoUrl={howItWorks.videoUrl}
                    posterUrl={howItWorks.posterUrl ?? undefined}
                  />
                </div>

                {/* Right Column: Steps */}
                <div className={`${hankenGrotesk.className} flex flex-col gap-8 md:gap-10`}>
                  {howItWorks.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-5 group">
                      {/* Circular Step Badge */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#914B8C] flex items-center justify-center text-white font-bold text-xl shadow-md transition-all duration-300 group-hover:scale-110">
                        {index + 1}
                      </div>

                      {/* Text Content */}
                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-[#1A1A1A] font-extrabold text-xl md:text-2xl transition-colors duration-300 group-hover:text-[#914B8C]">
                          {step.heading}
                        </h4>
                        <p className="text-[#555555] font-medium text-sm md:text-base leading-relaxed max-w-lg">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}


