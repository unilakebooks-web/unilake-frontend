"use client";

import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Plus } from "lucide-react";

interface HeroSlidePageHeaderProps {
  onAddClick: () => void;
}

export function HeroSlidePageHeader({ onAddClick }: HeroSlidePageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/80 backdrop-blur-md rounded-3xl border border-[#914A8C]/15 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-13 h-13 rounded-2xl bg-[#914A8C]/10 border border-[#914A8C]/20 flex items-center justify-center text-[#914A8C] shrink-0 p-3">
          <ImageIcon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#914A8C] uppercase">
            Hero Slides
          </h1>
          <p className="text-xs text-[#914A8C]/70 font-semibold mt-0.5">
            Manage homepage banner carousel. Newest uploaded slides display first.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={onAddClick}
          className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold h-11 px-5 shadow-sm transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add Slide</span>
        </Button>
      </div>
    </div>
  );
}
