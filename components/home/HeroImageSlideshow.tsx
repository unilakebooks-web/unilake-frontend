"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { HeroImage } from "@/app/types/heroimage";

interface HeroImageSlideshowProps {
  images: HeroImage[];
  fallbackSrc: string;
  width: number;
  height: number;
  className?: string;
}

export function HeroImageSlideshow({
  images,
  fallbackSrc,
  width,
  height,
  className = "",
}: HeroImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [images.length]);

  // Fallback state if no images are active
  if (images.length === 0) {
    return (
      <div
        className={`relative overflow-hidden w-full max-w-full ${className}`}
        style={{ maxWidth: width, aspectRatio: `${width} / ${height}` }}
      >
        <Image
          src={fallbackSrc}
          alt="Hero Image"
          fill
          sizes="(max-width: 1024px) 100vw, 540px"
          className="object-cover w-full h-full"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden w-full max-w-full ${className}`}
      style={{ maxWidth: width, aspectRatio: `${width} / ${height}` }}
    >
      {images.map((img, index) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={img.imageUrl}
            alt="Hero Slideshow Image"
            fill
            sizes="(max-width: 1024px) 100vw, 540px"
            className="object-cover w-full h-full"
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}
