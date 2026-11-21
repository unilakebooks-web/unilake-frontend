import type { NextConfig } from "next";

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
