"use client";

import { useState } from "react";
import { hankenGrotesk, chauPhilomeneOne } from "@/app/fonts";
import { Faq } from "@/app/types/faq";

interface ComicFaqProps {
  faqs: Faq[];
}

export default function ComicFaq({ faqs }: ComicFaqProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="bg-[#F8E7D2] py-16">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        
        <h2 className={`${chauPhilomeneOne.className} text-[#3F3C95] text-3xl md:text-4xl uppercase mb-8 text-center`}>
          Frequently Asked Questions
        </h2>

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
  );
}
