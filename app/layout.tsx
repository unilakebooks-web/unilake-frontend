import type { Metadata } from "next";
import { preload } from "react-dom";
import "./globals.css";
import "./fonts.css";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import NavigationProgress from "@/components/shared/NavigationProgress";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PublicQueryProvider } from "@/components/providers/PublicQueryProvider";

import {
  geistSans,
  geistMono,
  poppins,
  chauPhilomeneOne,
  hankenGrotesk,
} from "@/app/fonts";
import { cn } from "@/lib/utils";
import {
  getSiteSetting,
  firstNonEmpty,
  SITE_NAME,
  SITE_URL,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
} from "@/lib/seo";

/**
 * Site-wide metadata, read from the admin's Settings row.
 *
 * `title.template` is what appends " | UniLake" to every page that sets its own
 * title. Pages that set NO title (the homepage) fall through to `title.default`
 * instead, which is why the homepage deliberately declares no metadata of its
 * own — it is meant to show exactly what the admin typed.
 *
 * getSiteSetting() never throws and is cached for five minutes, so this adds no
 * per-request API call and cannot take a page down when the backend is asleep.
 */
export async function generateMetadata(): Promise<Metadata> {
  const setting = await getSiteSetting();

  const siteTitle = firstNonEmpty(setting?.metaTitle) ?? DEFAULT_TITLE;
  const siteDescription =
    firstNonEmpty(setting?.metaDescription) ?? DEFAULT_DESCRIPTION;

  return {
    // Makes relative URLs in openGraph/alternates resolve to the real site.
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteTitle,
      template: `%s | ${SITE_NAME}`,
    },
    description: siteDescription,
    applicationName: SITE_NAME,
    // Browser tab / bookmark icon. Hardcoded to the brand logo for now.
    icons: {
      icon: "/assets/home_page/logo.png",
      apple: "/assets/home_page/logo.png",
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: siteTitle,
      description: siteDescription,
      url: SITE_URL,
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
    },
  };
}

// next/font used to preload the Latin file of each font declared here; with the fonts self-hosted that is done by hand.
const PRELOADED_FONTS = [
  "geist-caa3a2e1cccd8315",
  "geist-mono-797e433ab948586e",
  "poppins-c875c6f5d3e977ac", // 300
  "poppins-a218039a3287bcfd", // 400
  "poppins-8e6fa89aa22d24ec", // 500
  "poppins-e2334d715941921e", // 600
  "poppins-47fe1b7cd6e6ed85", // 700
  "poppins-829ba4228c966254", // 800
  "poppins-4b766aa38fdaaae3", // 900
  "chau-philomene-one-9e4592de12c05293",
  "hanken-grotesk-c47649aa31f9e140",
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  for (const f of PRELOADED_FONTS) {
    preload(`/fonts/${f}.woff2`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }
  return (
    <html
      lang="en"
      className={cn(geistSans.variable, geistMono.variable, poppins.variable, chauPhilomeneOne.variable, hankenGrotesk.variable, "font-sans", "ffv-sans")}
    >
      <body className={`${poppins.className} min-h-screen`}>
        <PublicQueryProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </AuthProvider>
        </PublicQueryProvider>
        <NavigationProgress />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}