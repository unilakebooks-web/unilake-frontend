/**
 * The comic address rule, for instant feedback in the admin. The backend (src/lib/comicSlug.ts) is the real
 * check and answers with a 400 or 409. ⚠️ Duplicated value: this copy and the backend list change together.
 */

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 80;

/** Words that already mean something in the site's own routes, so a comic may not take them. */
export const RESERVED_SLUGS = [
  "new",
  "edit",
  "admin",
  "api",
  "preview",
  "personalize",
  "share",
  "login",
  "dashboard",
  "comic",
  "comics",
  "blog",
  "blogs",
  "team",
  "contact",
  "about",
  "faq",
  "how-it-works",
  "how_it_work",
  "privacy",
  "terms",
  "refund",
  "sitemap",
  "robots",
  "favicon",
  "_next",
];

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Lower-cases and trims; the rule is checked on this form. */
export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

/** A plain-language problem with the slug, or null when it is acceptable. */
export function validateSlug(value: string): string | null {
  const slug = normalizeSlug(value);

  if (slug.length === 0) return "Enter an address. A comic always keeps one.";
  if (slug.length < SLUG_MIN_LENGTH) {
    return `Use at least ${SLUG_MIN_LENGTH} characters.`;
  }
  if (slug.length > SLUG_MAX_LENGTH) {
    return `Use at most ${SLUG_MAX_LENGTH} characters.`;
  }
  if (!SLUG_PATTERN.test(slug)) {
    return "Use only lower case letters, numbers and single hyphens, with no hyphen at the start or end.";
  }
  if (UUID_PATTERN.test(slug)) {
    return "An address that looks like an id is not allowed.";
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return `"${slug}" is reserved by the site. Choose another address.`;
  }
  return null;
}
