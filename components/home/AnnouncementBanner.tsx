"use client";

import { useEffect, useState, useRef } from "react";
import { fetchPublicAnnouncements } from "@/app/actions/announcement";
import { Announcement } from "@/app/types/announcement";

interface AnnouncementBannerProps {
  onHeightChange?: (height: number) => void;
  /** Announcements already loaded by the page. When given, the banner does not fetch them itself. */
  initialAnnouncements?: Announcement[];
}

export default function AnnouncementBanner({ onHeightChange, initialAnnouncements }: AnnouncementBannerProps) {
  const [fetchedAnnouncements, setFetchedAnnouncements] = useState<Announcement[]>([]);
  // The page's list wins when it supplied one, so the banner and the header's offset always follow the same data.
  const announcements = initialAnnouncements ?? fetchedAnnouncements;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const bannerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Fetch active announcements on mount (unless the page already supplied them)
  const suppliedByPage = useRef(initialAnnouncements !== undefined);
  useEffect(() => {
    if (suppliedByPage.current) return;
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchPublicAnnouncements();
        if (isMounted) {
          setFetchedAnnouncements(data || []);
        }
      } catch (e: any) {
        if (isMounted) {
          setFetchedAnnouncements([]);
        }
        if (e?.code !== "ERR_NETWORK" && e?.code !== "NETWORK_ERROR") {
          console.error("Failed to load storefront announcements", e);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Coordinate rendered height with parent header
  useEffect(() => {
    if (announcements.length === 0) {
      onHeightChange?.(0);
      return;
    }
    const handleResize = () => {
      if (bannerRef.current && onHeightChange) {
        onHeightChange(bannerRef.current.offsetHeight);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [announcements.length, onHeightChange]);

  // Handle scroll visibility synchronously with Header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowBanner(false);
      } else {
        setShowBanner(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3-second automatic rotation with smooth crossfade
  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
        setIsVisible(true);
      }, 350); // 350ms fade transition window
    }, 3000); // 3-second cycle per announcement

    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0) {
    return null;
  }

  const currentItem = announcements[currentIndex] || announcements[0];

  return (
    <div
      ref={bannerRef}
      style={{
        transform: showBanner ? "translateY(0)" : "translateY(-100%)",
      }}
      className="fixed top-0 left-0 w-full z-[60] bg-[#914A8C] text-white border-b border-white/15 shadow-sm transition-transform duration-300 select-none"
    >
      {/* ⚠️ h-9 / sm:h-10 (plus the 1px border above) are also --announcement-h in app/globals.css */}
      <div className="max-w-[1440px] mx-auto px-6 h-9 sm:h-10 flex items-center justify-center">
        <div className="flex items-center gap-2 text-center text-xs sm:text-sm font-semibold tracking-wide overflow-hidden">
          {/* Pulsing indicator dot */}
          <span className="w-2 h-2 rounded-full bg-[#FFD54A] animate-pulse shrink-0 inline-block" />
          
          {/* Crossfading message text */}
          <span
            className={`transition-all duration-300 transform px-2 truncate sm:overflow-visible ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
            }`}
          >
            {currentItem?.message}
          </span>
        </div>
      </div>
    </div>
  );
}
