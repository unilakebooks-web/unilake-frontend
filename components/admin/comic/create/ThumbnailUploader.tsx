import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UploadCloud, X, GripVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ThumbnailItem {
  id: string; // unique local ID for dnd
  file: File;
  previewUrl: string;
}

interface ThumbnailUploaderProps {
  items: ThumbnailItem[];
  onChange: (items: ThumbnailItem[]) => void;
  error?: string;
}

function SortableThumbnail({ item, index, onRemove }: { item: ThumbnailItem; index: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 h-32 w-auto min-w-[6rem] shadow-sm flex items-center justify-center">
      <img src={item.previewUrl} alt={`Thumbnail ${index + 1}`} className="w-auto h-full object-contain" />
      
      {/* Overlay controls */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
        <div className="flex justify-end">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="flex justify-center">
          <div {...attributes} {...listeners} className="bg-black/50 text-white rounded cursor-grab active:cursor-grabbing p-1">
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      </div>
      
      {/* Primary Badge */}
      {index === 0 && (
        <div className="absolute top-1.5 left-1.5 bg-[#914A8C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
          PRIMARY
        </div>
      )}
    </div>
  );
}

export function ThumbnailUploader({ items, onChange, error }: ThumbnailUploaderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (items.length + acceptedFiles.length > 10) {
      alert("Maximum 10 thumbnails allowed");
      return;
    }
    const newItems = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...items, ...newItems]);
  }, [items, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    disabled: items.length >= 10,
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleRemove = (idToRemove: string) => {
    const item = items.find(i => i.id === idToRemove);
    if (item) URL.revokeObjectURL(item.previewUrl);
    onChange(items.filter(i => i.id !== idToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Cover Thumbnails</h3>
          <p className="text-xs text-neutral-500">Drag to reorder. The first image will be the primary cover.</p>
        </div>
        <span className="text-xs font-medium text-neutral-500">{items.length} / 10</span>
      </div>

      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-[#914A8C] bg-[#914A8C]/5" : 
          error ? "border-red-300 bg-red-50" : 
          "border-neutral-200 hover:border-[#914A8C]/50 hover:bg-neutral-50"
        } ${items.length >= 10 ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#F8E7D2] flex items-center justify-center text-[#914A8C]">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Click or drag images to upload
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              PNG, JPG, WEBP (max 10). No SVG.
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      {items.length > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-4 pb-2">
                {items.map((item, index) => (
                  <SortableThumbnail 
                    key={item.id} 
                    item={item} 
                    index={index} 
                    onRemove={() => handleRemove(item.id)} 
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
