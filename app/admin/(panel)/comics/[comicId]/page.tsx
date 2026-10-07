"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useComic } from "@/hooks/useComics";
import { ComicDetailHub } from "@/components/admin/comic/detail/ComicDetailHub";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComicDetailPage({ params }: { params: Promise<{ comicId: string }> }) {
  const router = useRouter();
  
  // Unwrap params using React.use() as recommended in Next.js 15+
  const resolvedParams = use(params);
  const comicId = resolvedParams.comicId;

  const { data: comic, isLoading, error, refetch } = useComic(comicId);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#914A8C]">
          <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
          <p className="font-bold">Loading Comic Details...</p>
        </div>
      </div>
    );
  }

  if (error || !comic) {
    // Determine if it's a 404
    const is404 = (error as any)?.code === "NOT_FOUND" || (error as any)?.message?.includes("404");
    
    return (
      <div className="max-w-3xl mx-auto py-12">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/admin/comics")}
          className="mb-8 text-neutral-600 hover:text-neutral-900 -ml-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Comics
        </Button>

        <div className="bg-red-50 border border-red-200 rounded-3xl p-12 text-center text-red-800 flex flex-col items-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="font-bold text-2xl mb-2">
            {is404 ? "Comic Not Found" : "Failed to load comic"}
          </h3>
          <p className="text-red-600 mb-6 max-w-md">
            {is404 
              ? "The comic you're looking for doesn't exist or has been deleted." 
              : (error as any)?.message || "A network error occurred."}
          </p>
          {!is404 && (
            <Button
              onClick={() => refetch()}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm px-8"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-2">
      <ComicDetailHub comic={comic} />
    </div>
  );
}
