"use client";

import { HeroImage } from "@/app/types/heroimage";
import { HeroSlideCard } from "./HeroSlideCard";
import { Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSlideGridProps {
  heroImages: HeroImage[];
  togglingId: string | null;
  onToggleStatus: (id: string) => void;
  onDelete: (heroImage: HeroImage) => void;
  onAddFirst: () => void;
}

export function HeroSlideGrid({
  heroImages,
  togglingId,
  onToggleStatus,
  onDelete,
  onAddFirst,
}: HeroSlideGridProps) {
  if (heroImages.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-[#914A8C]/20 p-12 text-center flex flex-col items-center justify-center min-h-[360px] shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-[#914A8C]/10 border border-[#914A8C]/20 flex items-center justify-center text-[#914A8C] mb-4 shadow-xs">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-neutral-900 mb-1">
          No Hero Slides Added Yet
        </h3>
        <p className="text-sm text-neutral-500 max-w-md mb-6 font-medium">
          Your homepage hero banner carousel is currently empty. Upload your first vibrant promotional banner to showcase on the storefront!
        </p>
        <Button
          onClick={onAddFirst}
          className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold h-11 px-6 shadow-sm transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Upload First Slide</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {heroImages.map((image, index) => (
        <HeroSlideCard
          key={image.id}
          heroImage={image}
          index={index}
          isToggling={togglingId === image.id}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
