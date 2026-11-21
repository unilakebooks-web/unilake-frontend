// The <title> of a shared book (feature 14). Pure, so it can be checked without a test runner:
// npx tsx lib/shareTitle.check.mts

const MAX_FIRST_NAME = 30;

/**
 * The first word of a child's name, at most 30 characters. Counted in whole characters as a person sees them
 * (grapheme clusters), so an emoji, a surrogate pair or a Devanagari conjunct is never cut in half. Without
 * Intl.Segmenter it falls back to code points.
 */
export function firstName(childName?: string | null): string {
  const word = (childName ?? "").trim().split(/\s+/)[0] ?? "";
  if (!word) return "";
  const units =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(word), (s) => s.segment)
      : Array.from(word);
  return units.slice(0, MAX_FIRST_NAME).join("");
}

/**
 * The page title for a share link. The root layout's title template adds " | UniLake", so the brand is not added
 * here. The name is used only when the customer chose to show it (the caller passes it only then).
 */
export function shareTitle(comicTitle: string, childName?: string | null): string {
  const name = firstName(childName);
  return name ? `${name}'s book: ${comicTitle}` : `${comicTitle}: a personalised book`;
}
