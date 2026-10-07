import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComicStatusBadge } from "@/components/admin/comic/ComicStatusBadge";
import { ComicDetail } from "@/app/types/comic";
import { formatAgeGroup } from "@/lib/comicTags";

interface ComicSummaryCardProps {
  comic: ComicDetail;
}

export function ComicSummaryCard({ comic }: ComicSummaryCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#914A8C]/5 to-transparent rounded-bl-full pointer-events-none" />

      <div className="mb-6 relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/admin/comics")}
          className="text-[#914A8C] hover:text-[#7a3e75] hover:bg-[#914A8C]/10 rounded-xl px-3 h-9 -ml-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Comics
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 relative z-10">
        {/* Primary Thumbnail */}
        <div className="relative rounded-2xl overflow-hidden shadow-md shrink-0 border border-neutral-200 bg-neutral-200 flex items-center justify-center h-44 w-auto min-w-[8rem] max-w-[16rem]">
          {comic.coverThumbnailUrls?.[0] ? (
            <img src={comic.coverThumbnailUrls[0]} alt="Primary Cover" className="w-auto h-full object-contain" />
          ) : (
            <div className="w-32 h-44 bg-[#F8E7D2]/50 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-[#914A8C]/50" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight leading-tight">
              {comic.title}
            </h1>
            <div className="flex items-center gap-3 shrink-0">
              {comic.isBestseller && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">
                  BESTSELLER
                </span>
              )}
              <ComicStatusBadge status={comic.status} className="px-3 py-1 text-sm" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-neutral-600 mb-6">
            {comic.genderTags.map((gender) => (
              <span
                key={gender}
                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-100"
              >
                {gender}
              </span>
            ))}
            {comic.ageGroups.length > 0 && (
              <span>• {comic.ageGroups.map(formatAgeGroup).join(", ")} yrs</span>
            )}
            {comic.themes.length > 0 && (
              <span>• {comic.themes.map((t) => t.name).join(", ")}</span>
            )}
          </div>

          <div className="mt-auto grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/50 p-4 rounded-2xl border border-neutral-100">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Pages</p>
              <p className="text-xl font-bold text-neutral-900">
                {comic.pages.length} <span className="text-sm font-medium text-neutral-500">/ {comic.pageCount}</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Bubbles</p>
              <p className="text-xl font-bold text-neutral-900">
                {comic.pages.reduce((acc, page) => acc + page.bubbles.length, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Fonts</p>
              <p className="text-xl font-bold text-neutral-900">{comic.fonts.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Thumbnails</p>
              <p className="text-xl font-bold text-neutral-900">{comic.coverThumbnailUrls.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
