"use client";

import Link from "next/link";
import { chauPhilomeneOne } from "@/app/fonts";
import { BANNER_HEADING_SIZE } from "@/components/home/bannerHeading";
import BlogCard from "@/components/blog/BlogCard";
import { BlogListItem } from "@/app/types/blog";
import { MoveRight } from "lucide-react";

interface LatestBlogsProps {
  blogs: BlogListItem[];
}

export default function LatestBlogs({ blogs }: LatestBlogsProps) {
  if (!blogs || blogs.length === 0) {
    return null;
  }

  // Display max 3 blogs on the homepage
  const displayBlogs = blogs.slice(0, 3);

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
            <h2
              className={`
                ${chauPhilomeneOne.className}
                text-white
                uppercase
                ${BANNER_HEADING_SIZE}
                text-center
                z-30
                relative
              `}
            >
              BLOGS
            </h2>
          </div>
        </div>
      </div>

      <section className="bg-[#F8E7D2] pb-20 pt-10 md:pt-16 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayBlogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>

          {/* View All Button */}
          <div className="mt-12 flex justify-center">
            <Link
              href="/blog"
              className="
                bg-transparent hover:bg-[#8E4A92] text-[#8E4A92] hover:text-white
                border-2 border-[#8E4A92]
                px-8 py-3 rounded-full font-bold shadow-sm
                transition-colors
                flex items-center justify-center gap-2
              "
            >
              <span>View All Posts</span>
              <MoveRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
