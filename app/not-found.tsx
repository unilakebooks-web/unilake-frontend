import Link from "next/link";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";

/**
 * The page for every address that does not exist (and for an unknown or unpublished comic, which the comic
 * layout turns into a real 404). Branded, with the site's header and footer and a way back to the books,
 * instead of Next's bare default. The 404 status and the noindex tag are added by Next itself.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      <div className="flex-1 max-w-3xl mx-auto px-6 sm:px-8 pt-40 pb-24 w-full text-center">
        <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl uppercase text-[#914A8C] mb-4`}>
          Page Not Found
        </h1>
        <p className={`${hankenGrotesk.className} text-lg text-[#555555] mb-10`}>
          We could not find the page you were looking for. It may have moved, or the book may no longer be available.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/comic"
            className={`${hankenGrotesk.className} inline-block bg-gradient-to-b from-[#3F3C95] to-[#2B2882] text-white font-extrabold text-sm md:text-base uppercase tracking-wider px-8 py-3 rounded-full border-b-[4px] border-[#C8942A] shadow-[0_4px_10px_rgba(63,60,149,0.3)] transition-all hover:brightness-110`}
          >
            Our Books
          </Link>
          <Link
            href="/"
            className={`${hankenGrotesk.className} inline-block text-[#914A8C] font-bold hover:underline`}
          >
            Back to Home
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
