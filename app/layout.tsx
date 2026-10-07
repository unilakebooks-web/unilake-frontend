import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PublicQueryProvider } from "@/components/providers/PublicQueryProvider";

import {
  geistSans,
  geistMono,
  poppins,
  chauPhilomeneOne,
  hankenGrotesk,
} from "@/app/fonts";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import {
  getSiteSetting,
  firstNonEmpty,
  SITE_NAME,
  SITE_URL,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
} from "@/lib/seo";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(geistSans.variable, geistMono.variable, poppins.variable, chauPhilomeneOne.variable, hankenGrotesk.variable, "font-sans", geist.variable)}
    >
      <body className={`${poppins.className} min-h-screen`}>
        <PublicQueryProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </AuthProvider>
        </PublicQueryProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}