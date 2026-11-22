"use client";

import Image from "next/image";
import Link from "next/link";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import { comicHref } from "@/lib/comicUrl";
import { toImageUrl } from "@/lib/imageUrl";
import StoryCard from "@/components/home/StoryCard";
import { useAllBooks } from "@/hooks/usePublicComics";
import type { BlogFeaturedComic } from "@/app/types/blog";

/**
 * "Explore Our Books" at the end of a blog post: the books the admin chose for this post, each a real link
 * with the book's title as its text. The API sends only published books; with none chosen nothing renders.
 *
 * Each book is shown as the same card as Explore Comics. The post's API sends only a title and covers, so the
 * full book (ages, price, description) comes from the all-books list. Until that arrives the heading and the
 * plain links stay in the page for search engines but are visually hidden, so no white tiles flash and no empty
 * heading shows; if it fails, or a book is not in the list, that book keeps the plain tile.
 */
export default function ExploreOurBooks({ comics }: { comics?: BlogFeaturedComic[] }) {
  if (!comics || comics.length === 0) return null;

  return <FeaturedBooks comics={comics} />;
}

// A separate component so a post with no chosen books does not download the all-books list.
function FeaturedBooks({ comics }: { comics: BlogFeaturedComic[] }) {
  const { data: allBooks, isLoading } = useAllBooks();

  return (
    <section aria-labelledby="explore-books-heading" className={isLoading ? "sr-only" : "mt-16"}>
      <h2
        id="explore-books-heading"
        className={`${chauPhilomeneOne.className} text-3xl md:text-4xl text-[#914A8C] mb-8 text-center`}
      >
        Explore Our Books
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
        {comics.map((comic) => {
          const fullComic = allBooks?.find((book) => book.id === comic.id);
          if (fullComic) {
            return (
              <li key={comic.id}>
                <StoryCard comic={fullComic} />
              </li>
            );
          }
          const cover = comic.coverThumbnailUrls?.[0];
          return (
            <li key={comic.id}>
              <Link
                href={comicHref(comic)}
                className="group flex flex-col items-center gap-3 text-center"
              >
                {cover && (
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] shadow-sm">
                    <Image
                      src={toImageUrl(cover)}
                      alt={comic.coverThumbnailAlts?.[0] || comic.title}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
                      className="object-contain"
                    />
                  </div>
                )}
                <span
                  className={`${hankenGrotesk.className} font-bold text-lg text-[#3F3C95] group-hover:underline`}
                >
                  {comic.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
