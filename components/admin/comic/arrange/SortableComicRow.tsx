"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComicListItem } from "@/app/types/comic";

interface SortableComicRowProps {
  comic: ComicListItem;
  position: number;
}

// One published book on the Arrange Books screen: drag handle, its number, cover and title.
export function SortableComicRow({ comic, position }: SortableComicRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: comic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200",
        isDragging
          ? "bg-white shadow-2xl border-[#914A8C] opacity-90 ring-4 ring-[#914A8C]/20"
          : "bg-white/70 backdrop-blur-sm shadow-sm border-[#914A8C]/15 hover:border-[#914A8C]/40"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${comic.title}`}
        title="Drag to reorder"
        className="p-2 text-neutral-400 hover:text-[#914A8C] hover:bg-[#914A8C]/10 rounded-lg cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="shrink-0 w-8 h-8 rounded-full bg-[#914A8C]/10 text-[#914A8C] font-bold flex items-center justify-center text-sm border border-[#914A8C]/20">
        {position}
      </div>

      <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 shrink-0 overflow-hidden">
        {comic.coverThumbnailUrls[0] ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={comic.coverThumbnailUrls[0]} alt="" className="w-full h-full object-cover" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-bold text-neutral-900 truncate" title={comic.title}>
          {comic.title}
        </div>
        {comic.isBestseller && (
          <span className="inline-block mt-1 text-[10px] bg-yellow-100 text-yellow-800 font-bold px-1.5 rounded">
            BESTSELLER
          </span>
        )}
      </div>
    </div>
  );
}
