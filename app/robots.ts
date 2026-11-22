import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Only the staff and account areas. /personalize, /share, /unsubscribe and /login are NOT blocked here:
        // they carry an X-Robots-Tag noindex header (next.config.ts), which a crawler can only read if it may
        // fetch the page.
        disallow: ["/admin", "/dashboard"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
