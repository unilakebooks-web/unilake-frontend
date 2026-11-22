import ComicIndex from "@/components/comic/ComicIndex";
import SeedAllBooks from "@/components/home/SeedAllBooks";

/**
 * Rendered per request: the "All our books" list at the bottom of the page is loaded here from the live
 * catalogue, and a build-time copy would freeze it until the next deploy (see app/page.tsx).
 *
 * The catalogue itself is a client component (filters and cards load in the browser); this server page only
 * adds the first-HTML list of book links.
 */
export const dynamic = "force-dynamic";

export default function ComicIndexPage() {
  return (
    <SeedAllBooks>
      <ComicIndex />
    </SeedAllBooks>
  );
}
