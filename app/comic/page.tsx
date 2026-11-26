import ComicIndex from "@/components/comic/ComicIndex";

/**
 * Rendered per request: the page's search title and description come from the admin's SEO text (see
 * layout.tsx), and a build-time copy would freeze them until the next deploy.
 *
 * The catalogue itself is a client component (filters and cards load in the browser).
 */
export const dynamic = "force-dynamic";

export default function ComicIndexPage() {
  return <ComicIndex />;
}
