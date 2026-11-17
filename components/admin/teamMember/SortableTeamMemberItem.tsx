"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableTeamMemberItemProps {
  id: string;
  label: string;
  children: ReactNode;
}

// One team member's card with a drag handle at its left edge. The card itself is
// passed in unchanged as children.
export function SortableTeamMemberItem({
  id,
  label,
  children,
}: SortableTeamMemberItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

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
        "flex items-center gap-2 relative",
        isDragging && "opacity-90 ring-4 ring-[#914A8C]/20 rounded-2xl",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${label}`}
        className="p-2 text-neutral-400 hover:text-[#914A8C] hover:bg-[#914A8C]/10 rounded-lg cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none"
        title="Drag to reorder"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
