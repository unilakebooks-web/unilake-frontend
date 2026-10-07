import { chauPhilomeneOne } from "@/app/fonts";
import { FALLBACK_FACT } from "@/hooks/useRotatingFact";

interface GeneratingPlaceholderProps {
  /**
   * The line to show under "GENERATING…".
   *
   * Passed in rather than rotated here on purpose: several of these are on
   * screen at once (the preview is a scrolling list of pages), and each one
   * running its own timer would leave them all showing different facts,
   * changing at different moments. PreviewViewer rotates once and hands the
   * same value to every card, so they move in step.
   */
  fact?: string;
}

export default function GeneratingPlaceholder({ fact }: GeneratingPlaceholderProps) {
  return (
    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-center p-8 z-10 rounded-sm">
      <div className="animate-pulse flex flex-col items-center">
        <h3 className={`${chauPhilomeneOne.className} text-4xl sm:text-5xl md:text-6xl text-black uppercase tracking-wider mb-4`}>
          GENERATING...
        </h3>
      </div>
      {/* Outside the pulsing wrapper: the text swaps every few seconds, and
          pulsing it as well made it hard to read. */}
      <p
        key={fact}
        className="text-[#333333] text-lg sm:text-xl max-w-sm leading-relaxed mt-4 animate-in fade-in duration-500"
      >
        {fact ?? FALLBACK_FACT}
      </p>
    </div>
  );
}
