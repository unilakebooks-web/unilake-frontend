import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { fetchPublicComics } from "@/app/actions/comic";
import { ALL_BOOKS_QUERY_KEY } from "@/components/home/allBooksQuery";

/**
 * How long the server waits for the list. A slow or sleeping API must not hold the whole page back for the full
 * request timeout (20 s): after this the page is sent without the seed and the browser loads the list itself.
 */
const SEED_WAIT_MS = 4000;

/**
 * Server wrapper that loads the published comics once and hands them to AllBooksList, so the list of links is
 * in the first HTML instead of appearing after a browser fetch.
 *
 * A failed fetch seeds nothing: AllBooksList then loads the list itself in the browser, and the page is
 * otherwise unaffected. A caller that already started the request can pass its promise as `comics`; without it
 * this fetches for itself. Callers must render per request (`dynamic = "force-dynamic"`), as the data is live.
 */
export default async function SeedAllBooks({
  children,
  comics,
}: {
  children: React.ReactNode;
  comics?: ReturnType<typeof fetchPublicComics>;
}) {
  const queryClient = new QueryClient();

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const tooSlow = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("books list too slow")), SEED_WAIT_MS);
    });
    queryClient.setQueryData(ALL_BOOKS_QUERY_KEY, await Promise.race([comics ?? fetchPublicComics(), tooSlow]));
  } catch {
    // Left unseeded on purpose, see above.
  } finally {
    clearTimeout(timer);
  }

  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>;
}
