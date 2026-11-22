/**
 * Writes one schema.org object into the page as JSON-LD, for search engines.
 *
 * Server component, nothing to hydrate. The data includes admin-typed text (titles, descriptions), so `<`
 * is written as <: a stray "</script>" in a title cannot close the tag early. The result is still
 * valid JSON with the same meaning.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
