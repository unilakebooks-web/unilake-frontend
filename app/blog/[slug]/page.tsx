import { fetchPublicBlogBySlug } from "@/app/actions/public";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import BlogBodyRenderer from "@/components/blog/BlogBodyRenderer";
import { loadBlog } from "@/components/blog/loadBlog";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import Link from "next/link";
import Image from "next/image";
import { MoveLeft } from "lucide-react";
import type { Metadata } from "next";
import {
  absoluteUrl,
  clampDescription,
  firstNonEmpty,
  htmlToPlainText,
  DEFAULT_DESCRIPTION,
} from "@/lib/seo";

const ENABLE_YOUTUBE_EMBEDS = false;

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Per-post title, description and share card.
 *
 * Fallback chain: the admin's SEO override, then the post's excerpt, then the
 * opening of the body with its HTML stripped — a post with neither an excerpt
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
    const description =
      firstNonEmpty(
        blog.metaDescription,
        blog.excerpt,
        blog.body ? htmlToPlainText(blog.body) : null
      ) ?? DEFAULT_DESCRIPTION;

    return {
      title,
      description: clampDescription(description),
      alternates: { canonical },
      openGraph: {
        type: "article",
        title,
        description: clampDescription(description),
        url: canonical,
        publishedTime: blog.createdAt,
        modifiedTime: blog.updatedAt,
        ...(blog.coverImageUrl && {
          images: [{ url: blog.coverImageUrl, alt: blog.title }],
        }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: clampDescription(description),
        ...(blog.coverImageUrl && { images: [blog.coverImageUrl] }),
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

  // 404 handling lives in loadBlog — see the note there on why the previous
  // `error?.response?.status === 404` check could never match.
  const blog = await loadBlog(slug);

  const dateStr = new Date(blog.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <main className="min-h-screen bg-[#F9E7D3] flex flex-col">
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
          
          <p className={`${hankenGrotesk.className} text-[#555555] font-medium`}>
            Published on {dateStr}
          </p>
        </header>

        {/* Cover Image — shown whole at its own proportions, never cropped.
            Width is capped by the column and height by min(70vh, 640px); the
            browser keeps the aspect ratio under both caps, so a landscape image
            still fills the column while a square or portrait one is limited by
            height and centered, instead of towering over the viewport. The
            frame (border, radius, shadow) sits on the image itself so it hugs
            the picture with no empty bands. width/height 0 + auto sizing is
            the next/image pattern for images whose real dimensions we don't
            store — the tradeoff is a small layout shift as it loads. */}
        {blog.coverImageUrl && (
          <div className="flex justify-center mb-12">
            <Image
              src={blog.coverImageUrl}
              alt={blog.title}
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
      </article>

      <Footer />
    </main>
  );
}
