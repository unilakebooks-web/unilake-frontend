"use client";

import { useRef } from "react";
import { useVideoPlayback } from "@/hooks/useVideoPlayback";

/**
 * A customer review video on the Reviews page. The page itself is a server component (the review text must be in
 * the first HTML), so the part that needs a browser lives here: the same playing rules as the other players of
 * the site, one video at a time and a pause when the visitor scrolls past it. Nothing loads until play is pressed.
 */
export default function ReviewVideo({
  src,
  label,
}: {
  src: string;
  label: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useVideoPlayback(videoRef, src);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      preload="none"
      playsInline
      aria-label={label}
      className="w-full aspect-video bg-black object-contain"
    />
  );
}
