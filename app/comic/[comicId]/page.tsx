"use client";

import { use } from "react";
import { usePublicComic } from "@/hooks/usePublicComics";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import ComicDetailContent from "@/components/comic/ComicDetailContent";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { usePublicFaqs } from "@/hooks/usePublicContent";
import ComicPageFaqSection from "@/components/comic/ComicPageFaqSection";
import ExploreMoreBooks from "@/components/comic/ExploreMoreBooks";

interface ComicPageProps {
  params: Promise<{
    comicId: string;
  }>;
}

export default function ComicPage({ params }: ComicPageProps) {
  // Unwrap params using React.use() for Next.js App Router
  const { comicId } = use(params);
  
  const { data: comic, isLoading, isError, error } = usePublicComic(comicId);
  const { data: faqs } = usePublicFaqs("COMIC");

  return (
    <div className="flex flex-col min-h-screen">
      <HomeHeaderSection />
      
      <main className="flex-1 bg-[#F8E7D2] pt-24">
        {isLoading ? (
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-16 flex flex-col lg:flex-row gap-12 lg:gap-16">
            <div className="w-full lg:w-[45%] flex flex-col items-center">
               <Skeleton className="w-full max-w-[380px] aspect-[427/310] rounded-xl mb-6 bg-gray-200/50" />
               <div className="w-full max-w-[480px] flex flex-col gap-4">
                 <Skeleton className="w-full h-16 rounded-[14px] bg-gray-200/50" />
                 <Skeleton className="w-full h-16 rounded-[14px] bg-gray-200/50" />
                 <Skeleton className="w-full h-16 rounded-[14px] bg-gray-200/50" />
               </div>
            </div>
            <div className="w-full lg:w-[55%]">
               <Skeleton className="w-full h-[600px] rounded-[24px] bg-gray-200/50" />
            </div>
          </div>
        ) : isError || !comic ? (
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-32 flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-[#3F3C95] mb-4">Comic Not Found</h1>
            <p className="text-gray-600 mb-8 max-w-md">
              {isError 
                ? "There was an error loading this comic. It may have been removed or unpublished."
                : "We couldn't find the comic you're looking for."}
            </p>
            <Link 
              href="/"
              className="flex items-center gap-2 px-6 py-3 bg-[#FFD54A] text-[#3F3C95] font-bold rounded-full hover:brightness-105 transition-all shadow-sm"
            >
              <MoveLeft size={20} />
              Back to Stories
            </Link>
          </div>
        ) : (
          <>
            <ComicDetailContent comic={comic} />
            <ComicPageFaqSection faqs={faqs || []} />
            <ExploreMoreBooks comicId={comicId} />
          </>
        )}

        <div className="flow-root bg-[#F8E7D2]">
          <Footer />
        </div>
      </main>
    </div>
  );
}
