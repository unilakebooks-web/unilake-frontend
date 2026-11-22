import type { Metadata } from "next";
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
import AllBooksList from "@/components/home/AllBooksList";
import SeedAllBooks from "@/components/home/SeedAllBooks";
import JsonLd from "@/components/seo/JsonLd";

import { fetchPublicComics } from "@/app/actions/comic";
import { fetchPublicCustomerReviews, fetchPublicTeamMembers, fetchPublicHowItWorks, fetchPublicFaqs, fetchPublicBlogs } from "@/app/actions/public";
import { getPublicHeroImages } from "@/app/actions/heroimage";
import { fetchPublicAnnouncements } from "@/app/actions/announcement";
import { absoluteUrl, buildPageMetadata, getSiteSetting, BRAND_ALTERNATE_NAME, BRAND_NAME, SITE_URL } from "@/lib/seo";

/**
 * The admin's SEO text for the home page when saved; otherwise nothing but the canonical, share tags and
 * default share image, so the title and description still come from the site settings (root layout).
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ slug: "HOME", path: "/" });
}

/**
 * Rendered per request, like the other pages that show admin-managed content (see app/privacy/page.tsx): the
 * announcement banner, reviews, team, blogs and FAQs are loaded here, so a change in the admin panel shows
 * on the next visit and not after the next deploy.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const setting = await getSiteSetting();
  // Only addresses the admin actually saved: the footer's built-in fallback links are not the brand's pages.
  const sameAs = [setting?.instagramUrl, setting?.facebookUrl, setting?.twitterUrl, setting?.youtubeUrl, setting?.linkedinUrl]
    .map((u) => u?.trim())
    .filter((u): u is string => !!u);
  // Only what the admin saved in the site settings, never the footer's built-in fallback contact details.
  const contactEmail = setting?.email?.trim();
  const contactPhone = setting?.phone?.trim();

  // Started now so the comics load alongside the batch below instead of after it.
  const comicsPromise = fetchPublicComics();
  // A rejection before SeedAllBooks awaits it must not surface as unhandled; SeedAllBooks still sees it.
  comicsPromise.catch(() => {});

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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: BRAND_NAME,
              alternateName: BRAND_ALTERNATE_NAME,
              url: SITE_URL,
            },
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: BRAND_NAME,
              alternateName: BRAND_ALTERNATE_NAME,
              url: SITE_URL,
              logo: absoluteUrl("/assets/home_page/logo.png"),
              ...(sameAs.length > 0 && { sameAs }),
              ...((contactEmail || contactPhone) && {
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  ...(contactEmail && { email: contactEmail }),
                  ...(contactPhone && { telephone: contactPhone }),
                },
              }),
            },
          ],
        }}
      />

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
      <SeedAllBooks comics={comicsPromise}>
        <AllBooksList />
      </SeedAllBooks>
      <Footer />

    </main>
  );
}