"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";

interface ComicThumbnailCarouselProps {
  images: string[];
  /** Optional promo video. Null/undefined for most comics. */
  videoUrl?: string | null;
}

type Slide =
  | { kind: "image"; url: string }
  | { kind: "video"; url: string };

const FALLBACK_IMAGE = "/assets/home_page/bookCover1.png";

/**
 * How many leading thumbnails the detail page carousel skips — it opens on
 * image 3. Only this carousel; the story card and share image still use them.
 */
const SKIPPED_LEADING_IMAGES = 2;

/**
 * Builds the slide list: drops the first two thumbnails, then places the video
 * third among what remains.
 *
 * The skip only applies when something is left afterwards. A comic with one or
 * two thumbnails shows all of them, so the carousel never ends up empty.
 *
 * `Math.min(2, images.length)` is the whole video positioning rule, applied to
 * the images AFTER the skip: with 3+ remaining it lands at index 2 (3rd), with
 * 2 at index 2 (3rd, i.e. last), with 1 at index 1 (2nd). No stored position
 * is needed.
 */
function buildSlides(allImages: string[], videoUrl?: string | null): Slide[] {
  const images =
    allImages.length > SKIPPED_LEADING_IMAGES
      ? allImages.slice(SKIPPED_LEADING_IMAGES)
      : allImages;

  const slides: Slide[] = images.map((url) => ({ kind: "image", url }));

  if (videoUrl) {
    slides.splice(Math.min(2, slides.length), 0, { kind: "video", url: videoUrl });
  }

  // Only substitute a placeholder when there is nothing at all to show. A comic
  // with a video but no images is not a real state (publishing requires at least
  // one thumbnail) but must not render an empty box if it ever occurs.
  if (slides.length === 0) {
    return [{ kind: "image", url: FALLBACK_IMAGE }];
  }

  return slides;
}

export default function ComicThumbnailCarousel({
  images,
  videoUrl,
}: ComicThumbnailCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Only meaningful once the browser has refused sound. Until then the video is
  // unmuted and this stays false.
  const [isMuted, setIsMuted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // null = the visitor has not touched the mute button, so autoplay negotiation
  // decides. Once they have, their choice wins on every subsequent return to the
  // slide — otherwise someone who deliberately muted gets sound thrown at them
  // the moment they navigate back.
  const userMutePreferenceRef = useRef<boolean | null>(null);

  const slides = useMemo(
    () => buildSlides(images, videoUrl),
    [images, videoUrl]
  );

  // The admin can remove the video (or a thumbnail) while this page is open;
  // TanStack refetches and the list shrinks underneath us, leaving currentIndex
  // pointing past the end. Clamping during render rather than in an effect keeps
  // it correct on the very first paint and avoids a cascading re-render.
  // buildSlides never returns an empty array, so this is always >= 0.
  const safeIndex = Math.min(currentIndex, slides.length - 1);

  const videoIndex = slides.findIndex((s) => s.kind === "video");
  const isVideoActive = videoIndex !== -1 && safeIndex === videoIndex;

  /**
   * Play/pause as the active slide changes.
   *
   * Autoplay policy: a browser rejects play() with audio until the user has
   * interacted with the page. So try with sound first, and on rejection retry
   * muted — which is always permitted — and surface an unmute button. A visitor
   * who has clicked anything gets sound; everyone else gets a silent video
   * rather than a dead frame.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isVideoActive) {
      // Leaving the slide. Pausing stops the audio without touching currentTime,
      // which is what makes returning resume instead of restart.
      video.pause();
      return;
    }

    let cancelled = false;

    const attemptPlay = async () => {
      const preference = userMutePreferenceRef.current;

      // Explicit choice already made — honour it instead of re-negotiating.
      if (preference !== null) {
        video.muted = preference;
        setIsMuted(preference);

        try {
          await video.play();
        } catch {
          // They asked for sound but the browser still refuses (e.g. they never
          // actually interacted). Degrade to muted rather than not playing.
          if (cancelled || preference) return;
          video.muted = true;
          setIsMuted(true);
          try {
            await video.play();
          } catch {
            // Nothing further to try.
          }
        }
        return;
      }

      video.muted = false;

      try {
        await video.play();
        if (!cancelled) setIsMuted(false);
      } catch {
        // Blocked with sound — fall back to muted autoplay.
        if (cancelled) return;

        video.muted = true;
        setIsMuted(true);

        try {
          await video.play();
        } catch {
          // Even muted autoplay was refused (rare — some data-saver modes).
          // Native controls are not shown, so leave it paused on its poster
          // frame rather than throwing.
        }
      }
    };

    void attemptPlay();

    return () => {
      cancelled = true;
    };
  }, [isVideoActive]);

  // Both step from safeIndex, not the raw state, so navigation stays correct
  // even on the render where the slide list has just shrunk.
  const handlePrevious = () => {
    setCurrentIndex(safeIndex === 0 ? slides.length - 1 : safeIndex - 1);
  };

  const handleNext = () => {
    setCurrentIndex(safeIndex === slides.length - 1 ? 0 : safeIndex + 1);
  };

  // A real user gesture, so unmuting here is always honoured by the browser.
  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    userMutePreferenceRef.current = nextMuted;

    if (!nextMuted) void video.play().catch(() => {});
  };

  const activeSlide = slides[safeIndex];

  return (
    <div className="flex flex-col items-center w-full max-w-[480px]">
      {/* Carousel Container — its height follows the cover box below, so the
          arrows (top-1/2) stay vertically centred on whatever shape it has. */}
      <div className="relative w-full flex items-center justify-center mb-6 px-4">

        {/* Book Cover Container with slight tilt. A 1:1 square on every
            slide, video included, so the box never changes size. */}
        <div className="relative w-full max-w-[380px] aspect-square -rotate-2 hover:rotate-0 transition-transform duration-500 origin-center">
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.15)] bg-slate-100">
            {/* object-contain: the whole cover is always visible; a non-square
                image gets light bands from the box background. */}
            {activeSlide?.kind === "image" && (
              <Image
                src={activeSlide.url}
                alt={`Cover ${safeIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 400px"
                priority
              />
            )}

            {/*
              The video element is rendered whenever the comic HAS a video, not
              only while its slide is active, and is hidden with CSS instead of
              being unmounted. Unmounting would reset currentTime, turning
              "resume where you left off" into "restart from zero".
            */}
            {videoUrl && (
              <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                  isVideoActive
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
                aria-hidden={!isVideoActive}
              >
                <video
                  ref={videoRef}
                  src={videoUrl}
                  // object-contain: letterbox rather than crop, so a non-square
                  // video keeps its whole frame inside the 1:1 cover box (black
                  // bands from the wrapper's bg-black fill the rest).
                  className="w-full h-full object-contain"
                  playsInline
                  loop
                  preload="metadata"
                />

                {isVideoActive && (
                  <button
                    onClick={handleToggleMute}
                    className="absolute bottom-3 right-3 w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors z-10"
                    aria-label={isMuted ? "Unmute video" : "Mute video"}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Previous Button */}
        {slides.length > 1 && (
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-[#FFD54A] border-[3px] border-[#3F3C95] rounded-full flex items-center justify-center text-[#3F3C95] shadow-lg hover:scale-110 transition-transform z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
        )}

        {/* Next Button */}
        {slides.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-[#FFD54A] border-[3px] border-[#3F3C95] rounded-full flex items-center justify-center text-[#3F3C95] shadow-lg hover:scale-110 transition-transform z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="flex items-center gap-2">
          {slides.map((slide, idx) => (
            <button
              key={`${slide.kind}-${slide.url}`}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === safeIndex
                  ? "w-8 h-2 bg-[#914A8C]"
                  : "w-2 h-2 bg-[#914A8C]/30 hover:bg-[#914A8C]/50"
              }`}
              aria-label={
                slide.kind === "video"
                  ? "Go to video slide"
                  : `Go to slide ${idx + 1}`
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
