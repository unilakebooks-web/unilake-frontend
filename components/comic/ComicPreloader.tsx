"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import { useRotatingFact } from "@/hooks/useRotatingFact";

/**
 * How long the preloader holds the user before handing over to the preview.
 *
 * This is a deliberate stall, not a measurement of anything: generation is
 * already running underneath (the preview page's hooks fire regardless of what
 * it renders), so this buys the pipeline a head start before the user sees the
 * first page. One constant drives both the bar and the completion timer, so the
 * two can never disagree about when "done" is.
 */
const PRELOADER_DURATION_MS = 55_000;

interface ComicPreloaderProps {
  childName: string;
  onComplete: () => void;
  /**
   * Rotating lines for this comic. Optional and often empty — the hook falls
   * back to a default line, so the caller never has to special-case it.
   */
  facts?: string[];
}

export default function ComicPreloader({ childName, onComplete, facts = [] }: ComicPreloaderProps) {
  // One fact every 5 seconds (FACT_ROTATION_MS), shuffled per visit. See the hook for why the
  // shuffle deliberately happens after mount rather than during render.
  const currentFact = useRotatingFact(facts);

  // The parent passes `onComplete` as an inline arrow, so it is a new function
  // on every one of its renders — and the preview page re-renders constantly
  // (TanStack polls every 10s while the socket is down, plus every WS event).
  //
  // Depending on it directly used to tear down and restart the timer on every
  // one of those renders, which reset the progress calculation to zero and made
  // the bar visibly jump backwards. Routing through a ref keeps the timer effect
  // on empty deps — it starts once and survives every parent render — while
  // still calling the current callback.
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onCompleteRef.current();
    }, PRELOADER_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    // `h-full` removed deliberately. It pinned this section to the viewport
    // height, so the artwork below could only ever have the space left over
    // after the heading, fact and bar — which is why raising its max-height
    // alone did nothing. With min-height only, the section still fills the
    // screen but is free to grow, and the artwork can be sized on its own
    // terms. Top padding trimmed from pt-32/40 to pt-24/28 to hand a further
    // ~50px back to it.
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-100px)] pt-24 lg:pt-28 pb-12 px-4 overflow-hidden relative z-10 bg-[#F9E3C8]">
       <h1 className={`${chauPhilomeneOne.className} text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1a1a1a] text-center mb-3`}>
          Generating {childName}&apos;s Book
       </h1>
       {/* Fixed height + a key on the text so a longer fact replacing a shorter
           one fades in place instead of shunting the progress bar down the page
           every three seconds. */}
       <p
          key={currentFact}
          className={`${hankenGrotesk.className} text-sm md:text-base text-gray-700 text-center mb-6 min-h-12 flex items-center justify-center max-w-xl px-4 animate-in fade-in duration-500`}
       >
          {currentFact}
       </p>
       
       <div className="w-full max-w-lg bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          {/* One linear keyframe animation across the whole duration rather than
              a JS interval nudging the width. The browser drives it, so it is
              smooth, costs zero re-renders for the full 55s, and cannot move
              backwards — the previous interval could, and did.
              Keyframes live in app/globals.css; see the note there for why this
              is an animation and not a transition. */}
          <div
             className="bg-[#3F3C95] h-full rounded-full"
             style={{
               animationName: "preloader-fill",
               animationDuration: `${PRELOADER_DURATION_MS}ms`,
               animationTimingFunction: "linear",
               animationFillMode: "forwards",
             }}
          ></div>
       </div>

       {/* Explicit height, NOT flex-1.

           flex-1 meant "take what is left over", which capped the artwork at
           roughly 470px however high the max-height was set — the max simply
           never came into play. A declared height is what actually sizes it,
           and object-contain keeps the aspect ratio, so height is the only
           dimension worth setting. The width cap is just a ceiling for very
           wide viewports. */}
       <div className="relative w-full max-w-5xl h-[340px] sm:h-[460px] lg:h-[600px]">
          <Image
            src="/assets/bb6bfa052a589a79ee6faa505134d5646df98202.png"
            alt="Generating Book"
            fill
            className="object-contain"
            priority
          />
       </div>
    </div>
  );
}
