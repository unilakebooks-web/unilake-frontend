"use client";

import { useState, useRef } from "react";

export function HowItWorksVideo({ videoUrl, posterUrl }: { videoUrl?: string | null; posterUrl?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  if (!videoUrl) return null;

  const onTogglePlay = () => {
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    } else {
      videoRef.current?.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const onToggleMute = () => setIsMuted(!isMuted);

  return (
    <div className="flex justify-center w-full">
      <div
        className="
          relative
          w-full
          max-w-[400px]
          aspect-[4/5]
          transition-transform
          duration-300
          hover:scale-[1.03]
        "
      >
        {/* Purple offset shadow */}
        <div className="absolute top-4 left-4 w-full h-full bg-[#914B8C] rounded-[24px] md:rounded-[32px] z-0" />

        {/* Video Content Container */}
        <div
          className="absolute top-0 left-0 w-full h-full overflow-hidden cursor-pointer z-10 rounded-[24px] md:rounded-[32px]"
          onClick={onTogglePlay}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            loop
            muted={isMuted}
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Interactive Mute Overlay */}
          {isPlaying && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm z-20 hover:bg-black/60 transition-colors cursor-pointer"
            >
              {isMuted ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
          )}

          {/* Custom Play Button Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/30 backdrop-blur-[2px] flex items-center justify-center shadow-lg transition-all duration-300 transform">
                <svg viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10 text-white fill-current ml-1">
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
