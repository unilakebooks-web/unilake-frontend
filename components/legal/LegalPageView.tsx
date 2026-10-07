import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import BlogBodyRenderer from "@/components/blog/BlogBodyRenderer";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import type { SitePage } from "@/app/types/sitePage";

/**
 * Shared shell for the three legal pages (privacy, terms, refund).
 *
 * They differ only by which slug they fetch, so the layout lives here rather
 * than being copied into each route. Mirrors the blog detail page's structure.
 */
export default function LegalPageView({ page }: { page: SitePage }) {
  const updatedAt = page.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-[#F9E7D3] flex flex-col">
      <HomeHeaderSection />

      <article className="flex-1 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-32 w-full">
        <header className="mb-10 text-center">
          <h1
            className={`${chauPhilomeneOne.className} text-4xl md:text-5xl text-[#222222] mb-4 leading-tight`}
          >
            {page.title}
          </h1>

          {updatedAt && (
            <p className={`${hankenGrotesk.className} text-[#555555] font-medium`}>
              Last updated on {updatedAt}
            </p>
          )}
        </header>

        <div className="bg-[#F9E7D3] rounded-3xl p-8 md:p-12 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-[#E5E7EB]">
          <BlogBodyRenderer html={page.body} />
        </div>
      </article>

      <Footer />
    </main>
  );
}
