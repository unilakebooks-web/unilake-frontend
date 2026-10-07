import { useRouter } from "next/navigation";
import { PageWithBubbles } from "@/app/types/comic";
import { Check, X, Image as ImageIcon, Map, MessageSquare, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageCardProps {
  page: PageWithBubbles;
  /**
   * Number to show on the badge. During an unsaved drag-reorder this is the
   * prospective position, which differs from the server's page.pageNumber.
   * Falls back to the stored number when omitted.
   */
  displayNumber?: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function PageCard({ page, displayNumber, onEdit, onDelete }: PageCardProps) {
  const router = useRouter();

  return (
    <div className="relative bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col group transition-all hover:border-[#914A8C]/30 hover:shadow-md">
      {/* Thumbnail Area */}
      <div className="relative h-56 flex items-center justify-center bg-neutral-100 overflow-hidden shrink-0 border-b border-neutral-100 p-2">
        {page.artworkUrl ? (
          <img src={page.artworkUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-contain drop-shadow-sm" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs font-semibold">No Artwork</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
          <div className="bg-[#914A8C] text-white font-black text-sm px-2.5 py-0.5 rounded shadow-sm">
            {displayNumber ?? page.pageNumber}
          </div>
          <div className="flex flex-col gap-1 items-end">
            {page.isPreviewPage && (
              <div className="bg-blue-500 text-white px-1.5 py-0.5 rounded shadow-sm flex items-center">
                <Eye className="w-3 h-3" />
              </div>
            )}
            {page.hasFace && (
              <div className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                FACE
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-3 pb-4 flex flex-col flex-1">
        
        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
            {page.artworkUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-red-400" />}
            <span className="truncate">Artwork</span>
          </div>
          {page.hasFace && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 bg-neutral-50 p-1.5 rounded-lg border border-neutral-100">
              {page.maskUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-red-400" />}
              <span className="truncate">Mask</span>
            </div>
          )}
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium p-1.5 rounded-lg border",
            !page.hasFace ? "col-span-2" : "",
            page.bubbles.length > 0 ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-neutral-50 border-neutral-100 text-neutral-600"
          )}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="truncate">{page.bubbles.length} Bubbles</span>
          </div>
        </div>

        {/* Warnings */}
        {page.warnings && page.warnings.length > 0 && (
          <div className="mb-3 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-700 leading-tight">
            ⚠️ {page.warnings.join(", ")}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-1.5">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEdit}
            className="flex-1 h-8 text-xs rounded-lg border-neutral-200"
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/admin/comics/${page.comicId}/pages/${page.id}/bubbles`)}
            className="flex-1 h-8 text-xs rounded-lg bg-[#F8E7D2]/50 border-[#F8E7D2] text-[#914A8C] hover:bg-[#F8E7D2] hover:text-[#914A8C]"
          >
            <Map className="w-3.5 h-3.5 mr-1" /> Map
          </Button>
        </div>
      </div>

      {/* Hover Delete Button */}
      <button 
        onClick={onDelete}
        className="absolute top-28 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-3 shadow-xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20 hover:bg-red-600 hover:scale-105"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
