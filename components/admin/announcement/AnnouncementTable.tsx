"use client";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Announcement } from "@/app/types/announcement";
import { SortableAnnouncementRow } from "./SortableAnnouncementRow";
import { Megaphone } from "lucide-react";

interface AnnouncementTableProps {
  announcements: Announcement[];
  togglingId: string | null;
  onReorder: (newAnnouncements: Announcement[]) => void;
  onToggleStatus: (id: string) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
  onAddFirst: () => void;
}

export function AnnouncementTable({
  announcements,
  togglingId,
  onReorder,
  onToggleStatus,
  onEdit,
  onDelete,
  onAddFirst,
}: AnnouncementTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6, // Prevents accidental dragging when clicking buttons or toggling switch
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = announcements.findIndex((item) => item.id === active.id);
      const newIndex = announcements.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(announcements, oldIndex, newIndex);
        onReorder(reordered);
      }
    }
  };

  if (announcements.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#914A8C]/25 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] mb-4 shadow-inner">
          <Megaphone className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 tracking-wide mb-2">
          No Announcements Yet
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 font-medium leading-relaxed">
          Create your first banner announcement to broadcast promotions, discount codes, or free shipping announcements across your storefront.
        </p>
        <button
          onClick={onAddFirst}
          className="px-6 py-3 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        >
          + Add First Announcement
        </button>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={announcements.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {announcements.map((announcement, idx) => (
            <SortableAnnouncementRow
              key={announcement.id}
              announcement={announcement}
              index={idx}
              isToggling={togglingId === announcement.id}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
