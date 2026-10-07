"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { chauPhilomeneOne } from "@/app/fonts";
import { BANNER_HEADING_SIZE } from "@/components/home/bannerHeading";

import { CustomerReview } from "@/app/types/customerReview";

const ITEMS_PER_PAGE = 3;

interface HappyCustomersProps {
  reviews: CustomerReview[];
}

export default function HappyCustomers({ reviews }: HappyCustomersProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const visibleVideos = reviews.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const goToPrev = () => {
    setPlayingVideoId(null);
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const goToNext = () => {
    setPlayingVideoId(null);
    setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* ===== Symmetrical Flared Purple Banner ===== */}
      <div className="relative w-full overflow-visible mt-20 lg:mt-32">
        {/* Flared wave SVG */}
        <svg
          viewBox="0 0 1728 311"
          className="w-full block h-[80px] sm:h-[120px] md:h-[160px] lg:h-[200px]"
          preserveAspectRatio="none"
        >
          <path
            fill="#914A8C"
            d="M66.9068 29.469L-1 0V297L60.6428 263.852C89.7598 248.195 122.304 240 155.364 240H278.89H416.829H535.5H698.224H836.5H1016.5H1151H1331.5H1500.38C1574.97 240 1648.08 260.856 1711.44 300.213L1728 310.5V0L1650.63 31.3555C1626.77 41.0275 1601.26 46 1575.51 46H1331.5H1151H1016.5H836.5H698.224H535.5H416.829H278.89H146.525C119.134 46 92.0343 40.3734 66.9068 29.469Z"
          />
        </svg>

        {/* Text overlay — centered vertically over the SVG.
            The left padding reserves the dino's footprint (its right edge
            plus a small gap, per breakpoint below), so the title is centered
            in the space beside the dino and never runs into it as it grows.
            Below 1280px this container starts at the viewport edge, so the
            padding equals the dino's right edge; above that the container
            is centered, so the reservation shrinks by the side gutter
            `(100vw - 1280px) / 2` and the title drifts back to true center.
            Vertically it spans only the band's flat strip (viewBox y 46→240
            of 311 → 14.8% top / 22.8% bottom), not the whole SVG box, whose
            flares sit lower and would center the title visibly low. */}
        <div className="absolute inset-x-0 top-[14.8%] bottom-[22.8%] flex items-center pointer-events-none">
          <div className="max-w-7xl mx-auto w-full relative flex items-center justify-center pr-4 sm:pr-8 pl-[116px] sm:pl-[176px] md:pl-[252px] lg:pl-[336px] xl:pl-[max(2rem,calc(412px_-_(100vw_-_1280px)/2))]">
            <h2
              className={`
                ${chauPhilomeneOne.className}
                text-white
                uppercase
                ${BANNER_HEADING_SIZE}
                sm:whitespace-nowrap
                text-center
                z-30
                relative
              `}
            >
              UniLake&rsquo;s Happy Customers
            </h2>
          </div>
        </div>

        {/* Dino Image — Top-Left, sitting above the bar */}
        <div
          className="
            absolute
            left-2
            sm:left-6
            md:left-10
            lg:left-16
            xl:left-24

            bottom-[20px]
            sm:bottom-[30px]
            md:bottom-[40px]
            lg:bottom-[45px]

            z-30
            pointer-events-none
            select-none
          "
        >
          <Image
            src="/assets/home_page/dinoImg.png"
            alt="Kid riding dinosaur"
            width={480}
            height={480}
            priority
            className="
              w-[100px]
              sm:w-[140px]
              md:w-[200px]
              lg:w-[260px]
              xl:w-[300px]
              h-auto
              object-contain
            "
          />
        </div>
      </div>

      {/* ===== Testimonial Videos Section ===== */}
      <section className="bg-[#F8E7D2] pb-20 pt-10 md:pt-16 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

          {/* Video Grid — 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {visibleVideos.map((review) => (
              <VideoCard
                key={review.id}
                review={review}
                isPlaying={playingVideoId === review.id}
                isMuted={isMuted}
                onTogglePlay={() => {
                  setPlayingVideoId(playingVideoId === review.id ? null : review.id);
                }}
                onToggleMute={() => setIsMuted(!isMuted)}
              />
            ))}
          </div>

          {/* ===== Previous / Next Navigation ===== */}
          <div className="flex items-center justify-center gap-4 mt-12">
            {/* Previous Button */}
            <button
              onClick={goToPrev}
              className="
                w-12 h-12
                rounded-full
                bg-[#914B8C]
                flex items-center justify-center
                text-white
                shadow-md
                transition-all duration-300
                hover:scale-110
                hover:bg-[#7d3f78]
                active:scale-95
                cursor-pointer
              "
              aria-label="Previous videos"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>

            {/* Dash separator */}
            <div className="w-8 h-1 bg-[#914B8C] rounded-full" />

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="
                w-12 h-12
                rounded-full
                bg-[#914B8C]
                flex items-center justify-center
                text-white
                shadow-md
                transition-all duration-300
                hover:scale-110
                hover:bg-[#7d3f78]
                active:scale-95
                cursor-pointer
              "
              aria-label="Next videos"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </div>

        </div>
      </section>
    </>
  );
}

function VideoCard({
  review,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
}: {
  review: CustomerReview;
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isPlaying) {
      videoRef.current?.play().catch((err) => console.log("Play interrupted", err));
    } else {
      videoRef.current?.pause();
    }
  }, [isPlaying]);

  return (
    <div className="flex justify-center">
      {/* Scrapbook SVG Frame Container */}
      <div
        className="
          relative
          w-full
          max-w-[290px]
          aspect-[414/724]
          transition-transform
          duration-300
          hover:scale-[1.03]
        "
      >
        {/* Background SVG frame */}
        <Image
          src="/assets/image_video_player.svg"
          alt="Video frame background"
          fill
          sizes="290px"
          className="pointer-events-none select-none z-0"
          priority
        />

        {/* Video Content Container */}
        <div
          className="absolute overflow-hidden cursor-pointer z-10"
          style={{
            left: "9.9%",
            top: "10.8%",
            width: "79.9%",
            height: "78.3%",
            borderRadius: "12%",
          }}
          onClick={onTogglePlay}
        >
          <video
            ref={videoRef}
            src={review.videoUrl}
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />

          {/* Interactive Mute Overlay (only active when playing) */}
          {isPlaying && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm z-20 hover:bg-black/60 transition-colors cursor-pointer"
            >
              {isMuted ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
          )}

          {/* Custom Play Button Overlay (hidden when video is playing) */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-white/30 backdrop-blur-[2px] flex items-center justify-center shadow-lg transition-all duration-300 transform">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
