import { fetchPublicBlogs } from "@/app/actions/public";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import { chauPhilomeneOne } from "@/app/fonts";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import BlogCard from "@/components/blog/BlogCard";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo";

const BLOG_INDEX_DESCRIPTION =
  "Stories, tips and ideas about reading, imagination and personalized books for children.";

export const metadata: Metadata = {
  title: "Blog",
  description: BLOG_INDEX_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: {
    title: "Blog",
    description: BLOG_INDEX_DESCRIPTION,
    url: absoluteUrl("/blog"),
  },
};

export default async function BlogIndexPage() {
  const blogs = await fetchPublicBlogs();

  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      {/* Hero Section */}
      <div className="relative w-full pt-32 pb-9 text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl uppercase text-[#914A8C] mb-4`}>
            Our Blog
          </h1>
          <p className={`${chauPhilomeneOne.className} text-lg md:text-xl text-[#555555] max-w-2xl mx-auto tracking-wide`}>
            Discover stories, tips, and updates from the world of personalized children&rsquo;s books.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 w-full">
        {/* Back to Home Link */}
        <Link href="/" className="inline-flex items-center text-[#8E4A92] hover:text-[#6a366d] font-bold mb-10 transition-colors">
          <MoveLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-[#E5E7EB]">
            <p className="text-[#555555] font-medium text-lg">No posts available yet.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for new articles!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
