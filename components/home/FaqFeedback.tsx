"use client";

import { boogaloo } from "@/app/fonts";
import FeedbackForm from "@/components/shared/FeedbackForm";

/**
 * The homepage "Feedback & Suggestion" block.
 *
 * Owns only the section chrome — heading and spacing. The form itself lives in
 * components/shared/FeedbackForm. This is its only caller; /contact has its own
 * ContactForm writing to a separate table.
 */
export default function FaqFeedback() {
  return (
    <section className="bg-[#F8E7D2] pb-24 pt-10 md:pt-16 relative">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col gap-6">
          {/* Header with purple circle dot */}
          <div className="flex items-center gap-4">
            <div className="w-5 h-5 rounded-full bg-[#8E4A92] shadow-sm" />
            <h3
              className={`
                ${boogaloo.className}
                text-[#000000]
                text-xl
                sm:text-2xl
                uppercase
                tracking-wide
              `}
            >
              Feedback &amp; Suggestion
            </h3>
          </div>

          <FeedbackForm />
        </div>
      </div>
    </section>
  );
}
