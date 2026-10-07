"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Announcement } from "@/app/types/announcement";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2, Loader2 } from "lucide-react";

interface SortableAnnouncementRowProps {
  announcement: Announcement;
  index: number;
  isToggling: boolean;
  onToggleStatus: (id: string) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
}

export function SortableAnnouncementRow({
  announcement,
  index,
  isToggling,
  onToggleStatus,
  onEdit,
  onDelete,
}: SortableAnnouncementRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: announcement.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 bg-white
        ${
          isDragging
            ? "shadow-2xl border-[#914A8C] opacity-95 scale-[1.01] bg-[#F8E7D2]/10"
            : "hover:border-[#914A8C]/40 border-[#914A8C]/15 shadow-xs hover:shadow-md"
        }
      `}
    >
      {/* Drag handle & Index badge */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-[#914A8C] hover:bg-[#F8E7D2]/50 focus:outline-none cursor-grab active:cursor-grabbing transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <span className="w-7 h-7 rounded-full bg-[#F8E7D2]/60 text-[#914A8C] font-extrabold text-xs flex items-center justify-center border border-[#914A8C]/20 select-none">
          {index + 1}
        </span>
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-neutral-800 font-medium text-sm md:text-base break-words leading-snug">
          {announcement.message}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium text-neutral-400">
          <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>Last updated: {new Date(announcement.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Status Toggle Badge & Switch */}
      <div className="flex items-center gap-3 shrink-0 px-3 py-1.5 bg-neutral-50/80 rounded-xl border border-neutral-100">
        <div className="flex flex-col items-end mr-1 select-none">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Status</span>
          <span
            className={`text-xs font-extrabold ${
              announcement.isActive ? "text-emerald-600" : "text-neutral-500"
            }`}
          >
            {announcement.isActive ? "ACTIVE" : "HIDDEN"}
          </span>
        </div>

        {isToggling ? (
          <div className="w-10 flex justify-center">
            <Loader2 className="w-5 h-5 text-[#914A8C] animate-spin" />
          </div>
        ) : (
          <Switch
            checked={announcement.isActive}
            onCheckedChange={() => onToggleStatus(announcement.id)}
            disabled={isToggling}
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-300 cursor-pointer"
            title={announcement.isActive ? "Click to disable" : "Click to publish"}
          />
        )}
      </div>

      {/* Actions (Edit & Delete) */}
      <div className="flex items-center gap-2 shrink-0 pl-2 border-l border-neutral-100">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(announcement)}
          className="text-neutral-600 hover:text-[#914A8C] hover:bg-[#914A8C]/10 rounded-xl transition-colors cursor-pointer"
          title="Edit announcement message"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(announcement)}
          className="text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          title="Delete announcement permanently"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
