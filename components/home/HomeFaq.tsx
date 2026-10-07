"use client";

import { useState } from "react";
import Image from "next/image";
import { boogaloo, hankenGrotesk } from "@/app/fonts";
import { BANNER_HEADING_SIZE } from "@/components/home/bannerHeading";
import { Faq } from "@/app/types/faq";

interface HomeFaqProps {
  faqs: Faq[];
}

export default function HomeFaq({ faqs }: HomeFaqProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!faqs || faqs.length === 0) {
    return null; // Don't render an empty shell
  }

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      {/* ===== Symmetrical Flared Purple Banner ===== */}
      {/* `id="faq"` lives here, not on the <section> below, so the /#faq links
          (Header, mobile menu, Footer) land on the heading rather than halfway
          down the question list.

          The scroll margin is how far the girl pokes up above this box (her
          height + bottom offset − the SVG height, per breakpoint below) plus
          the 86px fixed Header plus a 16px gap — so she lands fully visible
          even when the Header is showing. Change the girl's width/bottom or
          the SVG height and these numbers must move with them. */}
      <div
        id="faq"
        className="relative w-full overflow-visible mt-20 lg:mt-32 scroll-mt-[172px] sm:scroll-mt-[200px] md:scroll-mt-[206px] lg:scroll-mt-[250px] xl:scroll-mt-[273px]"
      >
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

        {/* Text overlay — centered vertically over the SVG.
            The left padding reserves the girl's footprint (her `left` offset
            + width + a small gap, per breakpoint below), so the title is
            centered in the space beside her and never runs into her. Below
            1280px this container starts at the viewport edge, so the padding
            equals that footprint; above that the container is centered, so
            the reservation shrinks by the side gutter `(100vw - 1280px) / 2`.
            Vertically it spans only the band's flat strip — viewBox y 46→240
            of 311, i.e. 14.8% from the top and 22.8% from the bottom — not
            the whole SVG box. The flares make the box taller below the strip
            than above it, so centering on the box sat the text visibly low. */}
        <div className="absolute inset-x-0 top-[14.8%] bottom-[22.8%] flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto w-full relative flex justify-center pr-4 sm:pr-8 pl-[140px] sm:pl-[212px] md:pl-[262px] lg:pl-[356px] xl:pl-[max(2rem,calc(408px_-_(100vw_-_1280px)/2))]">
            <h2
              className={`
                ${boogaloo.className}
                text-white
                uppercase
                ${BANNER_HEADING_SIZE}
                whitespace-nowrap
                z-30
                relative
              `}
            >
              FAQ&apos;s &amp; Feedback
            </h2>
          </div>
        </div>

        {/* Girl Image — Top-Left, sitting above the bar with space.
            Bottom offsets are unchanged, so the larger size grows upward;
            each width is capped so she stays within the section's top
            margin (mt-20, lg:mt-32) and doesn't reach the section above. */}
        <div
          className="
            absolute
            left-2
            sm:left-6
            md:left-10
            lg:left-16
            xl:left-24

            bottom-[10px]
            sm:bottom-[15px]
            md:bottom-[20px]
            lg:bottom-[22px]

            z-30
            pointer-events-none
            select-none
          "
        >
          <Image
            src="/assets/home_page/girlFeedbackImg.png"
            alt="Girl student raising hand"
            width={328}
            height={381}
            priority
            className="
              w-[120px]
              sm:w-[175px]
              md:w-[210px]
              lg:w-[280px]
              xl:w-[300px]
              h-auto
              object-contain
            "
          />
        </div>
      </div>

      {/* ===== Content Section ===== */}
      <section className="bg-[#F8E7D2] pb-6 pt-14 md:pt-20 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">

          {/* FAQ Accordion List.
              No bottom margin: the gap down to the Feedback block is this
              section's pb-6 plus FaqFeedback's own top padding (64px mobile,
              88px desktop). Adjust it there, not here — FaqFeedback's padding
              must still stand on its own when there are no FAQs and this
              component renders nothing. */}
          <div className="flex flex-col gap-5">
            {faqs.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => toggleFaq(item.id)}
                  className="
                    bg-white
                    rounded-xl
                    p-5
                    sm:p-6
                    shadow-[0_4px_15px_rgba(0,0,0,0.03)]
                    border border-transparent
                    hover:border-black/5
                    transition-all
                    duration-200
                    cursor-pointer
                    select-none
                  "
                >
                  <div className="flex items-center gap-6">
                    {/* Toggle Icon */}
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      {isExpanded ? (
                        /* Horizontal line — purple */
                        <div className="w-6 h-[3px] bg-[#8E4A92] rounded-full" />
                      ) : (
                        /* Plus symbol — black */
                        <svg
                          viewBox="0 0 24 24"
                          className="w-6 h-6 text-black fill-none stroke-current stroke-[3]"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </div>

                    {/* Question */}
                    <h3
                      className={`
                        ${hankenGrotesk.className}
                        font-extrabold
                        text-base
                        sm:text-lg
                        text-[#222222]
                        transition-colors
                        duration-200
                        ${isExpanded ? "text-[#8E4A92]" : ""}
                      `}
                    >
                      {item.question}
                    </h3>
                  </div>

                  {/* Answer (collapsible) */}
                  <div
                    className={`
                      overflow-hidden
                      transition-all
                      duration-300
                      ease-in-out
                      ${isExpanded ? "max-h-[300px] mt-4 opacity-100" : "max-h-0 opacity-0"}
                    `}
                  >
                    {/* PLAIN TEXT rendering — never use dangerouslySetInnerHTML here */}
                    <p
                      className={`
                        ${hankenGrotesk.className}
                        text-[#555555]
                        text-sm
                        sm:text-base
                        font-medium
                        leading-relaxed
                        pl-14
                      `}
                    >
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>
    </>
  );
}
