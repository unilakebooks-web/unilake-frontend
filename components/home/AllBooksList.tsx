"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicComics } from "@/app/actions/comic";
import { ALL_BOOKS_QUERY_KEY } from "@/components/home/allBooksQuery";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import { comicHref } from "@/lib/comicUrl";

/**
 * A plain, visible list of every published book: the title as the link text and one line of its description.
 *
 * The story cards only link to a comic through a "Free Preview" button, and only once the visitor's country
 * has a price, so on their own they give a search engine (and a visitor using a keyboard or a screen reader)
 * no readable link to each book. This list is the same for everyone and is in the first HTML when the page
 * wraps it in SeedAllBooks. It shows nothing until there is data, and nothing when there are no books.
 */
export default function AllBooksList() {
  const { data: comics } = useQuery({
    queryKey: ALL_BOOKS_QUERY_KEY,
    queryFn: () => fetchPublicComics(),
  });

  if (!comics || comics.length === 0) return null;

  return (
    <section
      aria-labelledby="all-books-heading"
      className="max-w-7xl mx-auto w-full px-6 sm:px-8 lg:px-12 py-12"
    >
      <h2
        id="all-books-heading"
        className={`${chauPhilomeneOne.className} text-2xl md:text-3xl text-[#914A8C] mb-6`}
      >
        All our books
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
        {comics.map((comic) => (
          <li key={comic.id}>
            <Link
              href={comicHref(comic)}
              className={`${hankenGrotesk.className} font-bold text-[#3F3C95] hover:underline`}
            >
              {comic.title}
            </Link>
            {comic.description && (
              <p className={`${hankenGrotesk.className} text-sm text-[#555555] line-clamp-2`}>
                {comic.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
