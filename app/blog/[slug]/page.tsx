import { fetchPublicBlogBySlug } from "@/app/actions/public";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import BlogBodyRenderer from "@/components/blog/BlogBodyRenderer";
import { loadBlog } from "@/components/blog/loadBlog";
import BlogAuthor from "@/components/blog/BlogAuthor";
import ExploreOurBooks from "@/components/blog/ExploreOurBooks";
import JsonLd from "@/components/seo/JsonLd";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import Link from "next/link";
import Image from "next/image";
import { MoveLeft } from "lucide-react";
import type { Metadata } from "next";
import { toImageUrl } from "@/lib/imageUrl";
import {
  absoluteUrl,
  clampDescription,
  firstNonEmpty,
  getSiteSetting,
  htmlToPlainText,
  BRAND_NAME,
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  laterDate,
} from "@/lib/seo";

const ENABLE_YOUTUBE_EMBEDS = false;

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * The search description and the share image of a post, in one place so the page's meta tags and its
 * BlogPosting markup can never disagree.
 */
function blogSeoParts(blog: Awaited<ReturnType<typeof fetchPublicBlogBySlug>>) {
  const description =
    firstNonEmpty(
      blog.metaDescription,
      blog.excerpt,
      blog.body ? htmlToPlainText(blog.body) : null
    ) ?? DEFAULT_DESCRIPTION;
  const shareImage = toImageUrl(firstNonEmpty(blog.ogImageUrl, blog.coverImageUrl));
  return { description, shareImage };
}

/**
 * Per-post title, description and share card.
 *
 * Fallback chain: the admin's SEO override, then the post's excerpt, then the
 * opening of the body with its HTML stripped - a post with neither an excerpt
 * nor an SEO description still gets something meaningful rather than the
 * generic site blurb.
 *
 * Never throws: an unpublished slug returns generic metadata, and the page
 * body below still calls notFound() for the actual 404.
 */
export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonical = absoluteUrl(`/blog/${slug}`);

  try {
    const blog = await fetchPublicBlogBySlug(slug);

    const title = firstNonEmpty(blog.metaTitle, blog.title) ?? "Blog";
    const { description, shareImage } = blogSeoParts(blog);
    // Share card: its own title, description and image when the admin set them, else the SEO
    // text above and the cover. The cover goes through toImageUrl like the comic covers do.
    const shareTitle = firstNonEmpty(blog.ogTitle, title) ?? title;
    const ogDescription = firstNonEmpty(blog.ogDescription);
    const shareDescription = ogDescription ? clampDescription(ogDescription) : clampDescription(description);
    const shareImageAlt = blog.ogImageUrl ? blog.title : firstNonEmpty(blog.coverImageAlt, blog.title) ?? blog.title;

    return {
      title,
      description: clampDescription(description),
      alternates: { canonical },
      openGraph: {
        type: "article",
        // Repeated here because Next replaces the root layout's openGraph object instead of merging into it.
        siteName: SITE_NAME,
        locale: "en_IN",
        title: shareTitle,
        description: shareDescription,
        url: canonical,
        // The same dates the page shows and the BlogPosting markup carries.
        publishedTime: blog.publishedAt ?? blog.createdAt,
        modifiedTime: laterDate(blog.contentUpdatedAt, blog.publishedAt ?? blog.createdAt),
        ...(shareImage && {
          images: [{ url: shareImage, alt: shareImageAlt }],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title: shareTitle,
        description: shareDescription,
        ...(shareImage && { images: [shareImage] }),
      },
    };
  } catch {
    return {
      title: "Blog",
      description: DEFAULT_DESCRIPTION,
      alternates: { canonical },
    };
  }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  // Unwrap params
  const { slug } = await params;

  // 404 handling lives in loadBlog - see the note there on why the previous
  // `error?.response?.status === 404` check could never match.
  const blog = await loadBlog(slug);
  const setting = await getSiteSetting();

  // The dates shown are the dates in the markup below. publishedAt is the first time the post went live
  // (createdAt is when the draft was started); contentUpdatedAt moves only when the title, excerpt, body or
  // cover change, so the publish switch or an unchanged save never makes the post look freshly updated.
  const publishedDate = blog.publishedAt ?? blog.createdAt;
  const updatedDate = laterDate(blog.contentUpdatedAt, publishedDate);
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  const url = absoluteUrl(`/blog/${blog.slug}`);
  const authorName = setting?.blogAuthorName?.trim();
  const { description: seoDescription, shareImage } = blogSeoParts(blog);

  return (
    <main className="min-h-screen bg-[#F9E7D3] flex flex-col">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              headline: blog.title,
              description: clampDescription(seoDescription),
              url,
              mainEntityOfPage: url,
              datePublished: publishedDate,
              dateModified: updatedDate,
              ...(shareImage && { image: [shareImage] }),
              ...(authorName && { author: { "@type": "Person", name: authorName } }),
              publisher: { "@type": "Organization", name: BRAND_NAME },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
                { "@type": "ListItem", position: 3, name: blog.title, item: url },
              ],
            },
          ],
        }}
      />
      <HomeHeaderSection />

      <article className="flex-1 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-32 w-full">
        {/* Back Link */}
        <Link href="/blog" className="inline-flex items-center text-[#8E4A92] hover:text-[#6a366d] font-bold mb-8 transition-colors">
          <MoveLeft className="w-5 h-5 mr-2" />
          Back to Blogs
        </Link>

        {/* Header */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            {blog.tags.map((tag: string) => (
              <span key={tag} className="bg-[#8E4A92] text-white px-3 py-1 rounded-full uppercase tracking-wider text-xs font-bold shadow-sm">
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className={`${chauPhilomeneOne.className} text-4xl md:text-5xl lg:text-6xl text-[#222222] mb-6 leading-tight`}>
            {blog.title}
          </h1>
          
          <BlogAuthor setting={setting} />

          <p className={`${hankenGrotesk.className} text-[#555555] font-medium`}>
            Published on {formatDate(publishedDate)}
          </p>
          <p className={`${hankenGrotesk.className} text-[#555555] font-medium`}>
            Last Updated On: {formatDate(updatedDate)}
          </p>
        </header>

        {/* Cover Image - shown whole at its own proportions, never cropped.
            Width is capped by the column and height by min(70vh, 640px); the
            browser keeps the aspect ratio under both caps, so a landscape image
            still fills the column while a square or portrait one is limited by
            height and centered, instead of towering over the viewport. The
            frame (border, radius, shadow) sits on the image itself so it hugs
            the picture with no empty bands. width/height 0 + auto sizing is
            the next/image pattern for images whose real dimensions we don't
            store - the tradeoff is a small layout shift as it loads. */}
        {blog.coverImageUrl && (
          <div className="flex justify-center mb-12">
            <Image
              src={blog.coverImageUrl}
              alt={blog.coverImageAlt || blog.title}
              width={0}
              height={0}
              className="block w-auto h-auto max-w-full max-h-[min(70vh,640px)] rounded-3xl border-4 border-white shadow-lg"
              priority
              sizes="(max-width: 1024px) 100vw, 900px"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-[#F9E7D3] rounded-3xl p-8 md:p-12 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-[#E5E7EB]">
          <BlogBodyRenderer html={blog.body} embedYouTube={ENABLE_YOUTUBE_EMBEDS} />
        </div>

        <ExploreOurBooks comics={blog.featuredComics} />
      </article>

      <Footer />
    </main>
  );
}
