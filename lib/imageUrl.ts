/**
 * Serves R2 images from the site's own image domain.
 *
 * The backend stores every image as a full `https://pub-….r2.dev/<key>` URL.
 * That address is Cloudflare's development URL: rate-limited and never cached.
 * The same bucket is also served, with edge caching, from a custom domain. When
 * NEXT_PUBLIC_IMAGES_URL names it (for example https://images.unilakekids.com),
 * the host of a stored URL is swapped for it at the moment the image is drawn.
 *
 * Display only, on purpose. The stored URLs, the database and the backend are
 * not touched: the backend cuts R2_PUBLIC_URL_BASE off stored URLs to find the
 * file (PDF build, page generation, deletes), so those URLs must stay as they
 * are. Unset the variable and every image goes back to its stored address.
 */
const R2_DEV_URL = /^https:\/\/pub-[a-z0-9]+\.r2\.dev\//;

export function toImageUrl<T extends string | null | undefined>(url: T): T {
  const base = process.env.NEXT_PUBLIC_IMAGES_URL?.replace(/\/$/, "");
  if (!base || !url || !R2_DEV_URL.test(url)) return url;
  return url.replace(R2_DEV_URL, `${base}/`) as T;
}
