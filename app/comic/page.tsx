"use client";

import { useState } from "react";
import Link from "next/link";
import { MoveLeft, Loader2 } from "lucide-react";
import { chauPhilomeneOne } from "@/app/fonts";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import StoryFilters from "@/components/home/StoryFilters";
import StoryCard from "@/components/home/StoryCard";
import { usePublicComics } from "@/hooks/usePublicComics";

export default function ComicIndexPage() {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  // An empty list means no filter — that's what each dropdown's "All …" sends.
  const handleFilterChange = (filterId: string, values: string[]) => {
    setSelectedFilters((prev) => ({ ...prev, [filterId]: values }));
  };

  const { data: comics, isLoading, error } = usePublicComics({
    ageGroup: selectedFilters.ageGroup,
    gender: selectedFilters.gender,
    themeId: selectedFilters.themeId,
  });

  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      {/* Hero Section */}
      <div className="relative w-full pt-32 pb-9 text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl uppercase text-[#914A8C] mb-4`}>
            Choose Your Story
          </h1>
          <p className={`${chauPhilomeneOne.className} text-lg md:text-xl text-[#555555] max-w-2xl mx-auto tracking-wide`}>
            Filter and discover the perfect personalized comic for your child.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 w-full">
        {/* Back to Home Link */}
        <Link href="/" className="inline-flex items-center text-[#8E4A92] hover:text-[#6a366d] font-bold mb-6 transition-colors">
          <MoveLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {/* Filter Pills */}
        <StoryFilters
          selected={selectedFilters}
          onChange={handleFilterChange}
        />

        {/* Cards Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-[#E5E7EB]">
              <Loader2 className="w-12 h-12 text-[#914B8C] animate-spin mb-4" />
              <p className="text-[#555555] font-medium text-lg">Loading stories...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-[#E5E7EB]">
              <p className="text-red-500 font-medium text-lg">Failed to load stories. Please try again.</p>
            </div>
          ) : comics && comics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-16">
              {comics.map((comic) => (
                <StoryCard key={comic.id} comic={comic} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-[#E5E7EB]">
              <p className="text-[#555555] font-medium text-lg">No stories found matching your criteria.</p>
              <button
                onClick={() => setSelectedFilters({})}
                className="mt-6 px-6 py-2 bg-transparent border-2 border-[#914B8C] text-[#914B8C] font-bold rounded-full hover:bg-[#914B8C] hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
