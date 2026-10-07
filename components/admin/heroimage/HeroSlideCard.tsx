"use client";

import { HeroImage } from "@/app/types/heroimage";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, Calendar, Eye, EyeOff } from "lucide-react";

interface HeroSlideCardProps {
  heroImage: HeroImage;
  index: number;
  isToggling: boolean;
  onToggleStatus: (id: string) => void;
  onDelete: (heroImage: HeroImage) => void;
}

export function HeroSlideCard({
  heroImage,
  index,
  isToggling,
  onToggleStatus,
  onDelete,
}: HeroSlideCardProps) {
  const formattedDate = new Date(heroImage.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="group relative bg-white rounded-3xl border border-[#914A8C]/20 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Banner Thumbnail Container */}
      <div className="relative w-full aspect-[16/9] bg-neutral-900 overflow-hidden">
        <img
          src={heroImage.imageUrl}
          alt={`Hero Slide ${index + 1}`}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            !heroImage.isActive ? "grayscale-[40%] opacity-75" : ""
          }`}
          loading="lazy"
        />

        {/* Slide Position Badge */}
        <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-sm">
          <span>Slide #{index + 1}</span>
        </div>

        {/* Status Indicator Badge */}
        <div className="absolute top-3 right-3">
          {heroImage.isActive ? (
            <span className="bg-emerald-500 text-white backdrop-blur-md text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <Eye className="w-3.5 h-3.5" />
              <span>ACTIVE</span>
            </span>
          ) : (
            <span className="bg-neutral-800/90 text-neutral-300 backdrop-blur-md text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-neutral-600 shadow-sm">
              <EyeOff className="w-3.5 h-3.5" />
              <span>HIDDEN</span>
            </span>
          )}
        </div>
      </div>

      {/* Control Footer */}
      <div className="p-4 bg-white flex items-center justify-between gap-3 border-t border-[#914A8C]/10 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
          <Calendar className="w-3.5 h-3.5 text-[#914A8C]/70" />
          <span>Added {formattedDate}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Status Toggle Switch */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 border border-neutral-200/80">
            <span className="text-xs font-bold text-neutral-700 select-none">
              {heroImage.isActive ? "Live" : "Hide"}
            </span>
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#914A8C]" />
            ) : (
              <Switch
                checked={heroImage.isActive}
                onCheckedChange={() => onToggleStatus(heroImage.id)}
                disabled={isToggling}
                className="data-[state=checked]:bg-[#914A8C] cursor-pointer"
              />
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(heroImage)}
            title="Delete slide permanently"
            className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 transition-colors flex items-center justify-center shrink-0 shadow-xs cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
