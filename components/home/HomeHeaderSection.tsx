"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AnnouncementBanner from "./AnnouncementBanner";
import Header from "./Header";
import type { Announcement } from "@/app/types/announcement";

interface HomeHeaderSectionProps {
  /** Passed through to Header - see HeaderProps.showOnlyAtTop. */
  showOnlyAtTop?: boolean;
  /**
   * The home page passes the announcements it loaded (when there are some), so the banner is there from the
   * first paint and the header's offset is known without waiting for the browser to fetch and measure it.
   * Without it the banner loads itself and the header moves if one arrives.
   */
  announcements?: Announcement[];
}

export default function HomeHeaderSection({ showOnlyAtTop = false, announcements }: HomeHeaderSectionProps = {}) {
  const [bannerHeight, setBannerHeight] = useState(0);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  // CSS length when the page supplied the list (known before anything is measured), else what the banner
  // reported after loading itself.
  const pageSuppliedBanner = isHomePage && !!announcements?.length;
  const topOffset = pageSuppliedBanner ? "var(--announcement-h)" : isHomePage ? bannerHeight : 0;

  return (
    <>
      {isHomePage && <AnnouncementBanner onHeightChange={setBannerHeight} initialAnnouncements={announcements} />}
      <Header topOffset={topOffset} showOnlyAtTop={showOnlyAtTop} />
    </>
  );
}
