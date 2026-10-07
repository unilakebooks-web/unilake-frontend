"use client";

import { Loader2 } from "lucide-react";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";

interface RegenerateSlideProps {
  onRegenerate: () => Promise<void>;
  isLoading: boolean;
  isGenerating: boolean;
  triesLeft: number;
}

export default function RegenerateSlide({
  onRegenerate,
  isLoading,
  isGenerating,
  triesLeft,
}: RegenerateSlideProps) {
  const disabled = triesLeft <= 0 || isLoading || isGenerating;

  return (
    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center text-center p-8 z-10 rounded-sm">
      <h3 className={`${hankenGrotesk.className} text-2xl md:text-3xl font-bold text-black mb-1`}>
        Unsatisfied?
      </h3>
      <p className={`${hankenGrotesk.className} text-xl md:text-2xl text-black mb-8`}>
        Re-Generate A New Version<br />Of This Page
      </p>

      <button
        onClick={onRegenerate}
        disabled={disabled}
        className={`${chauPhilomeneOne.className} flex items-center justify-center gap-2 px-10 py-3 bg-[#FFD54A] text-[#3F3C95] rounded-full font-bold text-2xl uppercase tracking-wider border-[3px] border-[#3F3C95] shadow-[4px_4px_0px_#3F3C95] hover:shadow-[2px_2px_0px_#3F3C95] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-8`}
      >
        {isLoading || isGenerating ? (
          <Loader2 size={24} className="animate-spin mr-2" />
        ) : null}
        RE-GENERATE
      </button>

      <div className={`${hankenGrotesk.className} text-lg md:text-xl text-black`}>
        <p>3 X Version For Free Preview</p>
        <p>8 X Versions For Paid Previews</p>
      </div>
      
      {triesLeft <= 0 && (
        <p className="mt-4 text-red-500 font-medium text-sm">No tries left</p>
      )}
    </div>
  );
}
