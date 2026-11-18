import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Hero from "@/components/home/Hero";
import ChooseStory from "@/components/home/ChooseStory";
import HappyCustomers from "@/components/home/HappyCustomers";
import GoogleReviews from "@/components/home/GoogleReviews";
import OurTeam from "@/components/home/OurTeam";
import HomeFaq from "@/components/home/HomeFaq";
import LatestBlogs from "@/components/home/LatestBlogs";
import FeedbackForm from "@/components/home/FaqFeedback";
import Footer from "@/components/home/Footer";

import { fetchPublicCustomerReviews, fetchPublicTeamMembers, fetchPublicHowItWorks, fetchPublicFaqs, fetchPublicBlogs } from "@/app/actions/public";
import { getPublicHeroImages } from "@/app/actions/heroimage";
import { fetchPublicAnnouncements } from "@/app/actions/announcement";

/**
 * Rendered per request, like the other pages that show admin-managed content (see app/privacy/page.tsx): the
 * announcement banner, reviews, team, blogs and FAQs are loaded here, so a change in the admin panel shows
 * on the next visit and not after the next deploy.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const [reviewsResult, teamResult, howItWorksResult, faqsResult, blogsResult, heroResult, announcementsResult] = await Promise.allSettled([
    fetchPublicCustomerReviews(),
    fetchPublicTeamMembers(),
    fetchPublicHowItWorks(),
    fetchPublicFaqs("HOME"),
    fetchPublicBlogs(),
    getPublicHeroImages(),
    fetchPublicAnnouncements(),
  ]);

  const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
  const members = teamResult.status === "fulfilled" ? teamResult.value : [];
  const howItWorksData = howItWorksResult.status === "fulfilled" ? howItWorksResult.value : null;
  const homeFaqs = faqsResult.status === "fulfilled" ? faqsResult.value : [];
  const blogs = blogsResult.status === "fulfilled" ? blogsResult.value : [];
  // Never rejects (it returns [] on failure); undefined only if it somehow did, and Hero then fetches for itself.
  const heroSlides = heroResult.status === "fulfilled" ? heroResult.value : undefined;
  // Loaded here so the banner is in the first HTML: fetched in the browser it arrived a moment after the page
  // and pushed the header down, so a click aimed at a nav link missed it. The function returns [] both for "none"
  // and for a failed request, so only a non-empty list is trusted; otherwise the banner loads itself as before.
  const loadedAnnouncements = announcementsResult.status === "fulfilled" ? announcementsResult.value : [];
  const announcements = loadedAnnouncements.length > 0 ? loadedAnnouncements : undefined;

  return (
    <main className="min-h-screen bg-[#F8E7D2] overflow-x-hidden">
      {/* ================= NAVBAR ================= */}

      <HomeHeaderSection announcements={announcements} />


      {/*Home Page */}
      <Hero heroImages={heroSlides} />
      < ChooseStory howItWorks={howItWorksData} />
      {reviews.length > 0 && <HappyCustomers reviews={reviews} />}
      <GoogleReviews />
      {members.length > 0 && <OurTeam members={members} />}
      
      <HomeFaq faqs={homeFaqs} />
      <FeedbackForm />
      <LatestBlogs blogs={blogs} />
      <Footer />

    </main>
  );
}