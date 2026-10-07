"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { PageWithBubbles } from "@/app/types/comic";
import { PageCard } from "./PageCard";

interface SortablePageCardProps {
  page: PageWithBubbles;
  /** Prospective position (1-based) — drives the badge while an order is unsaved. */
  displayNumber: number;
  /** True when the comic is PUBLISHED; hides the grip and locks dragging. */
  disabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Drag-and-drop wrapper around PageCard. Kept separate so PageCard stays a
 * plain presentational component, matching how SortableAnnouncementRow relates
 * to its row.
 *
 * The listeners sit on a dedicated grip rather than the whole card because
 * PageCard has three interactive controls (Edit, Map, hover-Delete) that would
 * otherwise compete with the drag gesture.
 */
export function SortablePageCard({
  page,
  displayNumber,
  disabled,
  onEdit,
  onDelete,
}: SortablePageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "relative opacity-90 scale-[1.02]" : "relative"}
    >
      {!disabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder page ${displayNumber}`}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-black/50 hover:bg-black/70 text-white rounded-md p-1 cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}

      <PageCard
        page={page}
        displayNumber={displayNumber}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
