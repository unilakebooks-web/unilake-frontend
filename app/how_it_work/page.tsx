import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import { HowItWorksVideo } from "@/components/home/HowItWorksVideo";
import { fetchPublicHowItWorks } from "@/app/actions/public";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";

const HOW_IT_WORKS_DESCRIPTION =
  "See how it works — upload a photo, pick a story, and we turn your child into the hero of their own printed comic book.";

export const metadata: Metadata = {
  title: "How It Works",
  description: HOW_IT_WORKS_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/how_it_work") },
  openGraph: {
    title: "How It Works",
    description: HOW_IT_WORKS_DESCRIPTION,
    url: absoluteUrl("/how_it_work"),
  },
};

export default async function HowItWorksPage() {
  const howItWorks = await fetchPublicHowItWorks();

  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      {/* Hero Section */}
      <div className="relative w-full pt-32 pb-9 text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl uppercase text-[#914A8C] mb-4`}>
            How To Personalize
          </h1>
          <p className={`${chauPhilomeneOne.className} text-lg md:text-xl text-[#555555] max-w-2xl mx-auto tracking-wide`}>
            Learn how we bring your child's story to life in a few simple steps.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 w-full">
        {/* Back to Home Link */}
        <Link href="/" className="inline-flex items-center text-[#8E4A92] hover:text-[#6a366d] font-bold mb-10 transition-colors">
          <MoveLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {howItWorks ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center pb-24">
            {/* Left Column: Video Mockup */}
            <div className="relative w-full flex justify-center lg:justify-start">
              <HowItWorksVideo
                videoUrl={howItWorks.videoUrl}
                posterUrl={howItWorks.posterUrl ?? undefined}
              />
            </div>

            {/* Right Column: Steps */}
            <div className={`${hankenGrotesk.className} flex flex-col gap-8 md:gap-10`}>
              {howItWorks.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-5 group">
                  {/* Circular Step Badge */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#914B8C] flex items-center justify-center text-white font-bold text-xl shadow-md transition-all duration-300 group-hover:scale-110">
                    {index + 1}
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[#1A1A1A] font-extrabold text-xl md:text-2xl transition-colors duration-300 group-hover:text-[#914B8C]">
                      {step.heading}
                    </h4>
                    <p className="text-[#555555] font-medium text-sm md:text-base leading-relaxed max-w-lg">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-[#E5E7EB]">
            <p className="text-[#555555] font-medium text-lg">Content not available right now.</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
