import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { fetchPublicComics } from "@/app/actions/comic";
import { ALL_BOOKS_QUERY_KEY } from "@/components/home/allBooksQuery";

/**
 * Server wrapper that loads the published comics once and hands them to AllBooksList, so the list of links is
 * in the first HTML instead of appearing after a browser fetch.
 *
 * A failed fetch seeds nothing: AllBooksList then loads the list itself in the browser, and the page is
 * otherwise unaffected. Callers must render per request (`dynamic = "force-dynamic"`), as the data is live.
 */
export default async function SeedAllBooks({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  try {
    queryClient.setQueryData(ALL_BOOKS_QUERY_KEY, await fetchPublicComics());
  } catch {
    // Left unseeded on purpose, see above.
  }

  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
