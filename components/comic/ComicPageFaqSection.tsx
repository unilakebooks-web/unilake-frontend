"use client";

import { useState } from "react";
import Image from "next/image";
import { hankenGrotesk, boogaloo } from "@/app/fonts";
import { BANNER_HEADING_SIZE } from "@/components/home/bannerHeading";
import { Faq } from "@/app/types/faq";

interface ComicPageFaqSectionProps {
  faqs: Faq[];
}

export default function ComicPageFaqSection({ faqs }: ComicPageFaqSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!faqs || faqs.length === 0) {
    return null; // Don't render an empty shell
  }

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <>
      {/* ===== Symmetrical Flared Purple Banner =====
          `mt-20 lg:mt-32` is load-bearing, not decoration. The girl below is
          taller than the banner and deliberately overhangs its top edge, so
          this margin is the space she overhangs INTO. Without it she sits on
          top of whatever section precedes this one — on this page, the comic's
          info cards.
          ⚠️ This banner started as a copy of components/home/HomeFaq.tsx but
          now deliberately differs: on the comic page the heading reads just
          "FAQ'S" and is sized like the homepage's "Choose Your Story", and the
          girl matches that banner's dragon in height. If the girl grows,
          re-check the overhang against this margin — the numbers are in the
          comment on her below. */}
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

        {/* Heading — centred in the band. Sized with the shared
            BANNER_HEADING_SIZE scale to match "Choose Your Story" on the
            homepage; the font stays Boogaloo, which the FAQ bands use on
            purpose. The row spans only the band's flat strip (viewBox y
            46→240 of 311 → 14.8% top / 22.8% bottom) so it centres on the
            purple, not on the flared SVG box. */}
        <div className="absolute inset-x-0 top-[14.8%] bottom-[22.8%] flex items-center justify-center px-4 pointer-events-none">
          <h2
            className={`
              ${boogaloo.className}
              whitespace-nowrap
              text-white
              uppercase
              ${BANNER_HEADING_SIZE}
              z-30
              relative
            `}
          >
            FAQ&apos;S
          </h2>
        </div>

        {/* FAQ girl — pinned to the band's far left, independent of the
            centred heading. Her left inset grows with the screen; the short
            heading sits well clear of her at every width.

            Height matches the homepage dragon at every breakpoint.
            DragonImg.png is 669x374, so the dragon stands 78 / 162 / 212 / 257
            / 291px tall at its 140 / 290 / 380 / 460 / 520px widths;
            faq-girl.png is 741x867, so the same heights need widths of 67 /
            139 / 181 / 220 / 249px.

            She stands 10 / 15 / 20 / 22px above the band's lower edge.
            Overhang above the band's top = offset + height − band height:
            8 / 57 / 72 / 79 / 113px — inside the wrapper's mt-20 (80px) and
            lg:mt-32 (128px) at every breakpoint. */}
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
            z-20
            pointer-events-none
            select-none
          "
        >
          <Image
            src="/assets/home_page/faq-girl.png"
            alt="FAQ girl"
            width={741}
            height={867}
            priority
            className="
              w-[67px]
              sm:w-[139px]
              md:w-[181px]
              lg:w-[220px]
              xl:w-[249px]
              h-auto
              object-contain
            "
          />
        </div>
      </div>

      {/* ===== Content Section ===== */}
      <section className="bg-[#F8E7D2] pb-20 pt-10 md:pt-16 relative">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          
          {/* FAQ Accordion List */}
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
                        <div className="w-6 h-[3px] bg-[#3F3C95] rounded-full" />
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
                        ${isExpanded ? "text-[#3F3C95]" : ""}
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
