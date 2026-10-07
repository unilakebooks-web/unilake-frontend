import { AlertTriangle, ChevronRight } from "lucide-react";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";

/**
 * Shown in place of GENERATING… once a page has exhausted every retry.
 *
 * Deliberately amber rather than red, and worded as recoverable rather than
 * broken: the page IS retryable via the regenerate slide, so this is a nudge,
 * not a failure notice.
 *
 * The raw `errorMessage` is never rendered here. It is backend text — RunPod
 * status codes, stack fragments — and means nothing to a parent buying a
 * comic. It goes to the console in useSessionPreview instead.
 *
 * Mirrors GeneratingPlaceholder's positioning exactly so swapping between the
 * two causes no layout shift.
 */
export default function PageErrorPlaceholder() {
  return (
    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-center p-8 z-10 rounded-sm">
      <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-5 shadow-sm">
        <AlertTriangle size={32} />
      </div>

      <h3
        className={`${chauPhilomeneOne.className} text-2xl sm:text-3xl md:text-4xl text-black uppercase tracking-wide mb-3`}
      >
        Couldn&apos;t create this page
      </h3>

      <p
        className={`${hankenGrotesk.className} text-[#333333] text-base sm:text-lg max-w-sm leading-relaxed`}
      >
        Our AI server had trouble with this one. Swipe to the next slide and hit
        Regenerate to try again.
      </p>

      {/* Points at the regenerate slide the copy just referred to. */}
      <div className="flex items-center gap-1 mt-6 text-[#3F3C95] animate-pulse">
        <span className={`${hankenGrotesk.className} text-sm font-bold uppercase tracking-wider`}>
          Next slide
        </span>
        <ChevronRight size={20} />
      </div>
    </div>
  );
}
