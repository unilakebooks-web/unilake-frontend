import Link from "next/link";
import Image from "next/image";
import { MoveLeft } from "lucide-react";
import type { Metadata } from "next";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import {
  fetchPublicCustomerReviews,
  fetchPublicGoogleReviews,
} from "@/app/actions/public";
import { buildPageMetadata } from "@/lib/seo";
import { MAX_RATING, type GoogleReview } from "@/app/types/googleReview";
import type { CustomerReview } from "@/app/types/customerReview";
import ReviewVideo from "@/components/reviews/ReviewVideo";

const REVIEWS_DESCRIPTION =
  "Read what parents say about UniLake personalised comic books, with video reviews and Google reviews from families whose child became the hero of their own story.";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    slug: "REVIEWS",
    path: "/reviews",
    title: "Reviews",
    description: REVIEWS_DESCRIPTION,
  });
}

/** Rendered per request, like the home page that shows the same admin-managed reviews (see app/page.tsx). */
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  // Both fetches already return [] on failure; the try/catch keeps the page up even if one ever throws.
  let customerReviews: CustomerReview[] = [];
  let googleReviews: GoogleReview[] = [];
  try {
    [customerReviews, googleReviews] = await Promise.all([
      fetchPublicCustomerReviews(),
      fetchPublicGoogleReviews(),
    ]);
  } catch {
    customerReviews = [];
    googleReviews = [];
  }

  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      <div className="relative w-full pt-32 pb-9 text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h1
            className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl uppercase text-[#914A8C] mb-4`}
          >
            Customer Reviews
          </h1>
          <p
            className={`${chauPhilomeneOne.className} text-lg md:text-xl text-[#555555] max-w-2xl mx-auto tracking-wide`}
          >
            What parents say about their child&apos;s personalised comic book.
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-8 w-full">
        <Link
          href="/"
          className="inline-flex items-center text-[#8E4A92] hover:text-[#6a366d] font-bold mb-10 transition-colors"
        >
          <MoveLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        {customerReviews.length === 0 && googleReviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-[#E5E7EB]">
            <p className="text-[#555555] font-medium text-lg text-center px-6">
              Reviews are coming soon. Please check back shortly.
            </p>
          </div>
        ) : (
          <>
            {customerReviews.length > 0 && (
              <section className="pb-16">
                <h2
                  className={`${chauPhilomeneOne.className} text-2xl md:text-3xl text-[#914A8C] mb-8`}
                >
                  Happy Customers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {customerReviews.map((review) => (
                    <article
                      key={review.id}
                      className="bg-white rounded-3xl shadow-sm border border-[#E5E7EB] overflow-hidden"
                    >
                      <ReviewVideo
                        src={review.videoUrl}
                        label={`Video review from ${review.customerName}`}
                      />
                      <div className="p-6">
                        <h3
                          className={`${hankenGrotesk.className} text-[#000000] font-extrabold text-lg mb-2`}
                        >
                          {review.customerName}
                        </h3>
                        <p
                          className={`${hankenGrotesk.className} text-[#333333] text-sm sm:text-base font-medium leading-relaxed`}
                        >
                          {review.description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {googleReviews.length > 0 && (
              <section className="pb-24">
                <h2
                  className={`${chauPhilomeneOne.className} text-2xl md:text-3xl text-[#914A8C] mb-8`}
                >
                  Reviews on Google
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {googleReviews.map((review) => (
                    <article
                      key={review.id}
                      className="bg-white rounded-3xl shadow-sm border border-[#E5E7EB] p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Image
                          src={review.imageUrl}
                          alt={review.imageAlt || review.customerName}
                          width={48}
                          height={48}
                          sizes="48px"
                          className="w-12 h-12 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <h3
                            className={`${hankenGrotesk.className} text-[#000000] font-extrabold text-base sm:text-lg break-words`}
                          >
                            {review.customerName}
                          </h3>
                          <div
                            className="flex items-center gap-0.5"
                            aria-label={`${review.rating} out of ${MAX_RATING} stars`}
                          >
                            {Array.from(
                              { length: MAX_RATING },
                              (_, i) => i + 1,
                            ).map((star) => (
                              <svg
                                key={star}
                                aria-hidden="true"
                                className={`w-5 h-5 fill-current ${star <= review.rating ? "text-yellow-400" : "text-gray-300"}`}
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p
                        className={`${hankenGrotesk.className} text-[#333333] text-sm sm:text-base font-medium leading-relaxed`}
                      >
                        {review.reviewText}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
