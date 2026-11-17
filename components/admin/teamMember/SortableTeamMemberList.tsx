"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { TeamMember } from "@/app/types/teamMember";

interface SortableTeamMemberListProps {
  members: TeamMember[];
  onReorder: (members: TeamMember[]) => void;
  children: ReactNode;
}

// Drag-and-drop around the team list. Rendered only when there are members, so
// the table's empty state does not call these hooks (same sensors as the FAQ list).
export function SortableTeamMemberList({
  members,
  onReorder,
  children,
}: SortableTeamMemberListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6, // Prevents accidental dragging when clicking buttons or toggling a switch
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = members.findIndex((item) => item.id === active.id);
      const newIndex = members.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(members, oldIndex, newIndex));
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={members.map((m) => m.id)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}
