"use client";

import Image from "next/image";
import { chauPhilomeneOne } from "@/app/fonts";
import { BANNER_HEADING_SIZE } from "@/components/home/bannerHeading";

import { TeamMember } from "@/app/types/teamMember";
import TeamMemberCard from "@/components/team/TeamMemberCard";

interface OurTeamProps {
  members: TeamMember[];
}

export default function OurTeam({ members }: OurTeamProps) {
  return (
    <>
      {/* ===== Symmetrical Flared Purple Banner ===== */}
      <div className="relative w-full overflow-visible mt-20 lg:mt-32">
        {/* Flared wave SVG */}
        <svg
          viewBox="0 0 1728 311"
          className="w-full block h-[80px] sm:h-[120px] md:h-[160px] lg:h-[200px]"
          preserveAspectRatio="none"
        >
          <path
            fill="#914A8C"
            d="M66.9068 29.469L-1 0V297L60.6428 263.852C89.7598 248.195 122.304 240 155.364 240H278.89H416.829H535.5H698.224H836.5H1016.5H1151H1331.5H1500.38C1574.97 240 1648.08 260.856 1711.44 300.213L1728 310.5V0L1650.63 31.3555C1626.77 41.0275 1601.26 46 1575.51 46H1331.5H1151H1016.5H836.5H698.224H535.5H416.829H278.89H146.525C119.134 46 92.0343 40.3734 66.9068 29.469Z"
          />
        </svg>

        {/* Text overlay — centered vertically on the band's flat strip
            (viewBox y 46→240 of 311 → 14.8% top / 22.8% bottom), not the
            whole SVG box, whose flares sit lower and would center it low. */}
        <div className="absolute inset-x-0 top-[14.8%] bottom-[22.8%] flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto w-full px-8 relative flex items-center justify-center">
            <div className="flex items-center justify-between w-full max-w-[270px] sm:max-w-[460px] md:max-w-[620px] lg:max-w-[780px] xl:max-w-[840px] px-2 sm:px-0">
              {/* Left Title Word */}
              <h2
                className={`
                  ${chauPhilomeneOne.className}
                  text-white
                  uppercase
                  ${BANNER_HEADING_SIZE}
                  z-30
                  relative
                `}
              >
                Our
              </h2>

              {/* Right Title Word */}
              <h2
                className={`
                  ${chauPhilomeneOne.className}
                  text-white
                  uppercase
                  ${BANNER_HEADING_SIZE}
                  z-30
                  relative
                `}
              >
                Team
              </h2>
            </div>
          </div>
        </div>

        {/* Center Team main overlay image */}
        <div
          className="
            absolute
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2
            z-20
            pointer-events-none
            select-none
            w-[160px]
            sm:w-[240px]
            md:w-[320px]
            lg:w-[400px]
            xl:w-[460px]
            h-auto
          "
        >
          <Image
            src="/assets/home_page/teamSectionMainImg.png"
            alt="Our Team Characters"
            width={460}
            height={320}
            priority
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* ===== Team Grid Section ===== */}
      <section className="bg-[#F8E7D2] pb-24 pt-14 md:pt-20 relative">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          {/* 3-Column Team Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-10 lg:gap-x-12">
            {members.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
