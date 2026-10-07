"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AnnouncementBanner from "./AnnouncementBanner";
import Header from "./Header";

interface HomeHeaderSectionProps {
  /** Passed through to Header — see HeaderProps.showOnlyAtTop. */
  showOnlyAtTop?: boolean;
}

export default function HomeHeaderSection({ showOnlyAtTop = false }: HomeHeaderSectionProps = {}) {
  const [bannerHeight, setBannerHeight] = useState(0);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <>
      {isHomePage && <AnnouncementBanner onHeightChange={setBannerHeight} />}
      <Header topOffset={isHomePage ? bannerHeight : 0} showOnlyAtTop={showOnlyAtTop} />
    </>
  );
}
