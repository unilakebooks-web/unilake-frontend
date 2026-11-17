"use client";

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
import type { ComicListItem } from "@/app/types/comic";
import { SortableComicRow } from "@/components/admin/comic/arrange/SortableComicRow";

interface ComicArrangeListProps {
  comics: ComicListItem[];
  onReorder: (comics: ComicListItem[]) => void;
}

export function ComicArrangeList({ comics, onReorder }: ComicArrangeListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = comics.findIndex((c) => c.id === active.id);
    const newIndex = comics.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(comics, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={comics.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {comics.map((comic, i) => (
            <SortableComicRow key={comic.id} comic={comic} position={i + 1} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
