import Image from "next/image";
import Link from "next/link";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import { comicHref } from "@/lib/comicUrl";
import { toImageUrl } from "@/lib/imageUrl";
import type { BlogFeaturedComic } from "@/app/types/blog";

/**
 * "Explore Our Books" at the end of a blog post: the books the admin chose for this post, each a real link
 * with the book's title as its text. The API sends only published books; with none chosen nothing renders.
 */
export default function ExploreOurBooks({ comics }: { comics?: BlogFeaturedComic[] }) {
  if (!comics || comics.length === 0) return null;

  return (
    <section aria-labelledby="explore-books-heading" className="mt-16">
      <h2
        id="explore-books-heading"
        className={`${chauPhilomeneOne.className} text-3xl md:text-4xl text-[#914A8C] mb-8 text-center`}
      >
        Explore Our Books
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {comics.map((comic) => {
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
