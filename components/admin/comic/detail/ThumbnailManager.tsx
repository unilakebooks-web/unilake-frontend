"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UploadCloud, X, GripVertical, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComicDetail } from "@/app/types/comic";
import { useSetThumbnails } from "@/hooks/useComics";
import { getThumbnailUploadUrls } from "@/app/actions/comic";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { toast } from "sonner";

interface ThumbnailManagerProps {
  comic: ComicDetail;
}

// Minimal component for dnd sorting
function SortableThumbnail({ 
  url, 
  index, 
  onRemove, 
  isRemoving 
}: { 
  url: string; 
  index: number; 
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 h-32 w-auto min-w-[6rem] shadow-sm flex items-center justify-center">
      <img src={url} alt={`Thumbnail ${index + 1}`} className="w-auto h-full object-contain" />
      
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
        <div className="flex justify-end">
          <button 
            type="button"
            disabled={isRemoving}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="bg-black/50 hover:bg-red-500 text-white rounded-full p-1 transition-colors disabled:opacity-50"
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
      
      {index === 0 && (
        <div className="absolute top-1.5 left-1.5 bg-[#914A8C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm pointer-events-none">
          PRIMARY
        </div>
      )}
    </div>
  );
}

export function ThumbnailManager({ comic }: ThumbnailManagerProps) {
  const { mutateAsync: setThumbnails, isPending: isUpdating } = useSetThumbnails();
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const currentUrls = comic.coverThumbnailUrls;
  const isWorking = isUploading || isUpdating;

  // Handle reorder
  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = currentUrls.findIndex((url) => url === active.id);
      const newIndex = currentUrls.findIndex((url) => url === over.id);
      const newOrder = arrayMove(currentUrls, oldIndex, newIndex);
      
      try {
        await setThumbnails({ comicId: comic.id, desired: newOrder });
        toast.success("Thumbnails reordered");
      } catch (err: any) {
        toast.error("Failed to reorder: " + err?.message);
      }
    }
  };

  // Handle delete
  const handleDelete = async (urlToRemove: string) => {
    if (currentUrls.length <= 1) {
      toast.error("A comic must have at least one thumbnail.");
      return;
    }
    if (!confirm("Remove this thumbnail? This action is permanent.")) return;

    const newOrder = currentUrls.filter(url => url !== urlToRemove);
    try {
      await setThumbnails({ comicId: comic.id, desired: newOrder });
      toast.success("Thumbnail removed");
    } catch (err: any) {
      toast.error("Failed to remove: " + err?.message);
    }
  };

  // Handle upload new
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (currentUrls.length + acceptedFiles.length > 10) {
      toast.error(`Maximum 10 thumbnails allowed. You can only add ${10 - currentUrls.length} more.`);
      return;
    }

    try {
      setIsUploading(true);
      
      const uploadFiles = acceptedFiles.map(file => ({
        fileName: file.name,
        contentType: file.type,
      }));
      
      // Get URLs
      const { uploads } = await getThumbnailUploadUrls(uploadFiles);
      
      // PUT to R2
      const uploadPromises = uploads.map((u, i) => 
        uploadToR2({ 
          uploadUrl: u.uploadUrl, 
          file: acceptedFiles[i], 
          contentType: acceptedFiles[i].type 
        })
      );
      
      await Promise.all(uploadPromises);
      
      // Update comic with current URLs + new keys
      const newKeys = uploads.map(u => u.key);
      const desired = [...currentUrls, ...newKeys];
      
      await setThumbnails({ comicId: comic.id, desired });
      toast.success("Thumbnails added successfully");
      
    } catch (err: any) {
      toast.error("Failed to upload thumbnails: " + err?.message);
    } finally {
      setIsUploading(false);
    }
  }, [comic.id, currentUrls, setThumbnails]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    disabled: currentUrls.length >= 10 || isWorking,
  });

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Cover Thumbnails</h2>
          <p className="text-sm text-neutral-500">
            {currentUrls.length} of 10 uploaded. Drag to reorder.
          </p>
        </div>
        {isWorking && (
          <div className="flex items-center text-xs font-semibold text-[#914A8C] bg-[#914A8C]/10 px-3 py-1 rounded-full">
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            Updating...
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm overflow-x-auto mb-6">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={currentUrls} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 pb-2">
              {currentUrls.map((url, index) => (
                <SortableThumbnail 
                  key={url} 
                  url={url} 
                  index={index} 
                  onRemove={() => handleDelete(url)}
                  isRemoving={isWorking}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
          isDragActive ? "border-[#914A8C] bg-[#914A8C]/5" : 
          currentUrls.length >= 10 || isWorking ? "border-neutral-200 opacity-50 cursor-not-allowed bg-neutral-50" : 
          "border-neutral-200 hover:border-[#914A8C]/50 hover:bg-neutral-50 cursor-pointer"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#F8E7D2] flex items-center justify-center text-[#914A8C]">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {currentUrls.length >= 10 ? "Maximum thumbnails reached" : "Click or drag images to add more thumbnail"}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              PNG, JPG, WEBP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
