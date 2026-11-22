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
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
