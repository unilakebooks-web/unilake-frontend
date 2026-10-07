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

export default async function Home() {
  const [reviewsResult, teamResult, howItWorksResult, faqsResult, blogsResult] = await Promise.allSettled([
    fetchPublicCustomerReviews(),
    fetchPublicTeamMembers(),
    fetchPublicHowItWorks(),
    fetchPublicFaqs("HOME"),
    fetchPublicBlogs(),
  ]);

  const reviews = reviewsResult.status === "fulfilled" ? reviewsResult.value : [];
  const members = teamResult.status === "fulfilled" ? teamResult.value : [];
  const howItWorksData = howItWorksResult.status === "fulfilled" ? howItWorksResult.value : null;
  const homeFaqs = faqsResult.status === "fulfilled" ? faqsResult.value : [];
  const blogs = blogsResult.status === "fulfilled" ? blogsResult.value : [];

  return (
    <main className="min-h-screen bg-[#F8E7D2] overflow-x-hidden">
      {/* ================= NAVBAR ================= */}

      <HomeHeaderSection />


      {/*Home Page */}
      <Hero />
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