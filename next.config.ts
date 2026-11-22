import type { NextConfig } from "next";

// Pages that must never appear in search results. A header rather than robots.txt: Google can only
// obey a noindex it is allowed to fetch, and a path blocked in robots.txt can still be listed by its URL alone.
// `/share` stays crawlable on purpose (link previews fetch it), so it gets the header but no robots.txt rule.
// app/robots.ts blocks only /admin and /dashboard; keep the two lists in step.
const PRIVATE_PATHS = [
  "/personalize/:path*",
  "/share/:path*",
  "/unsubscribe",
  "/login",
  "/dashboard/:path*",
  "/admin/:path*",
];

// Pages that stay reachable for customers but are kept out of search results, so that the site's main
// results show only the pages that sell and explain the product. Same header approach as above; links
// on them may still be followed.
const NOT_FOR_SEARCH_PATHS = ["/privacy", "/terms", "/refund", "/contact", "/team"];

// The only places the image optimiser loads pictures from: the storage bucket's public address (the host every
// stored picture address carries) and the site's own image domain when NEXT_PUBLIC_IMAGES_URL names one. Anything
// else is refused, so the optimiser cannot be used to fetch or serve pictures from arbitrary websites. A new
// bucket means new stored addresses, so its host has to be added here too.
const STORAGE_HOST = "pub-68a74d3878ae4e3cbc745bbec246f7ca.r2.dev";

// A value that is not a full address stops the build instead of quietly leaving every picture blank.
function imagesDomain(): { protocol: "http" | "https"; hostname: string } | null {
  const value = process.env.NEXT_PUBLIC_IMAGES_URL;
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_IMAGES_URL must be a full address, for example https://images.example.com");
  }
  return { protocol: url.protocol === "http:" ? "http" : "https", hostname: url.hostname };
}
const IMAGES_DOMAIN = imagesDomain();

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${process.env.NEXT_PUBLIC_AUTH_URL || "https://api.unilakekids.com"}/api/auth/:path*`,
      },
    ];
  },
  // Feature 14: a share link carries a private token, keep it out of any Referer header.
  async headers() {
    return [
      {
        source: "/share/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
      // Self-hosted fonts (their file names carry a content hash) and the site's own static files change rarely and
      // are not always renamed when they do, so they get a long, but not permanent, cache time instead of being
      // checked again on every visit.
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }],
      },
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      ...NOT_FOR_SEARCH_PATHS.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      })),
      ...PRIVATE_PATHS.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: STORAGE_HOST },
      ...(IMAGES_DOMAIN ? [IMAGES_DOMAIN] : []),
    ],
    // An allowed host that answers with a redirect would otherwise send the optimiser to any address.
    maximumRedirects: 0,
  },
};

export default nextConfig;
