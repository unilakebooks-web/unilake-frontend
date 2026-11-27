"use client";

import { useEffect, useState, type RefObject } from "react";

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

interface VideoSeekBarProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

/**
 * A seek bar for a <video>, like the one under a YouTube video: it shows how far the video has
 * played, and a click, a drag or the arrow keys jump to another moment. The players on the site
 * hide the browser's own controls, so this is how a visitor goes back or forward.
 * Clicks on the bar do not reach the player behind it (a click there would pause the video).
 */
export function VideoSeekBar({ videoRef }: VideoSeekBarProps) {
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setTime(video.currentTime);
    const onLength = () =>
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onLength);
    video.addEventListener("durationchange", onLength);
    // The length and the position may already be known when the bar mounts (the video can be paused
    // part-way when the bar comes back).
    const frame = requestAnimationFrame(() => {
      onTime();
      onLength();
    });
    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onLength);
      video.removeEventListener("durationchange", onLength);
    };
  }, [videoRef]);

  // Until the length is known there is nothing to seek in.
  if (!duration) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/50 to-transparent px-3 pb-2 pt-5"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="range"
        min={0}
        max={duration}
        step={1}
        value={Math.min(time, duration)}
        aria-label="Seek in the video"
        aria-valuetext={`${clock(time)} of ${clock(duration)}`}
        onChange={(e) => {
          const video = videoRef.current;
          if (!video) return;
          video.currentTime = Number(e.target.value);
          setTime(video.currentTime);
        }}
        className="pointer-events-auto block h-5 w-full cursor-pointer accent-[#FFD54A]"
      />
    </div>
  );
}
