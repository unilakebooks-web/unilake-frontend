interface PreviewProgressProps {
  pagesReady: number;
  /** Total preview pages expected. Always a real number — the hook falls back to the
   *  snapshot's own preview-page count when /generate's value isn't in memory. */
  totalPages: number;
  /** Defaults to the preview wording; the paid-pages bar passes its own. */
  title?: string;
}

export default function PreviewProgress({
  pagesReady,
  totalPages,
  title = "Generating your preview...",
}: PreviewProgressProps) {
  const total = Math.max(totalPages, 1);
  const rawPercent = (pagesReady / total) * 100;
  // Cap at 95% until we actually hit PREVIEW_READY state from the backend
  const progressPercent = Math.min(rawPercent, 95);

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <span className="text-sm font-medium text-[#3F3C95]">
          {pagesReady} of {totalPages} pages ready
        </span>
      </div>
      
      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#3F3C95] to-[#914A8C] transition-all duration-500 ease-out relative"
          style={{ width: `${progressPercent}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );
}
