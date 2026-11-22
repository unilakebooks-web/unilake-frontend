"use client";

import { useEffect, type RefObject } from "react";

/**
 * A playing video is paused when less than this share of it is still on screen, so it stops once
 * the visitor has scrolled past it but keeps playing while they are still looking at it.
 */
const VISIBLE_SHARE_TO_KEEP_PLAYING = 0.25;

/**
 * Playing rules shared by the site's video players: only one video plays at a time (starting this
 * one pauses every other <video> on the page), and a video pauses when the visitor scrolls past it.
 * `src` is only there so the rules attach once the <video> exists (a player may render it later).
 */
export function useVideoPlayback(
  videoRef: RefObject<HTMLVideoElement | null>,
  src?: string | null
): void {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      document.querySelectorAll("video").forEach((other) => {
        if (other !== video && !other.paused) other.pause();
      });
    };
    video.addEventListener("play", onPlay);

    // A browser without IntersectionObserver keeps only the one-at-a-time rule: the page must not break.
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              const entry = entries[entries.length - 1];
              if (
                entry.intersectionRatio < VISIBLE_SHARE_TO_KEEP_PLAYING &&
                !video.paused
              ) {
                video.pause();
              }
            },
            { threshold: VISIBLE_SHARE_TO_KEEP_PLAYING }
          );
    observer?.observe(video);

    return () => {
      video.removeEventListener("play", onPlay);
      observer?.disconnect();
    };
  }, [videoRef, src]);
}
