import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { chauPhilomeneOne } from "@/app/fonts";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import TeamMemberCard from "@/components/team/TeamMemberCard";
import { fetchPublicTeamMembers } from "@/app/actions/public";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";

const TEAM_DESCRIPTION =
  "Meet the people behind UniLake — the team creating personalized comic books for children.";

export const metadata: Metadata = {
  title: "Our Team",
  description: TEAM_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/team") },
  openGraph: {
    title: "Our Team",
    description: TEAM_DESCRIPTION,
    url: absoluteUrl("/team"),
  },
};

export default async function TeamPage() {
  const members = await fetchPublicTeamMembers();

  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      {/* Hero Section */}
      <div className="relative w-full pt-32 pb-9 text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl uppercase text-[#914A8C] mb-4`}>
            Our Team
          </h1>
          <p className={`${chauPhilomeneOne.className} text-lg md:text-xl text-[#555555] max-w-2xl mx-auto tracking-wide`}>
            Meet the creative minds bringing stories to life.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-8 w-full">
        {/* Back to Home Link */}
        <Link href="/" className="inline-flex items-center text-[#8E4A92] hover:text-[#6a366d] font-bold mb-10 transition-colors">
          <MoveLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {members && members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-10 lg:gap-x-12 pb-24">
            {members.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-[#E5E7EB]">
            <p className="text-[#555555] font-medium text-lg">No team members found.</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
