import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Faq } from "@/app/types/faq";
import { GripVertical, Edit2, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SortableFaqRowProps {
  faq: Faq;
  index: number;
  isToggling: boolean;
  onToggleStatus: (id: string) => void;
  onEdit: (faq: Faq) => void;
  onDelete: (faq: Faq) => void;
}

export function SortableFaqRow({
  faq,
  index,
  isToggling,
  onToggleStatus,
  onEdit,
  onDelete,
}: SortableFaqRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: faq.id,
  });

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
        "flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-200",
        isDragging
          ? "bg-white shadow-2xl border-[#914A8C] scale-[1.01] opacity-90 ring-4 ring-[#914A8C]/20"
          : "bg-white/70 backdrop-blur-sm shadow-sm border-[#914A8C]/15 hover:border-[#914A8C]/40 hover:shadow-md"
      )}
    >
      {/* Left side: Drag Handle & Content */}
      <div className="flex items-start md:items-center gap-4 flex-1 overflow-hidden">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-2 -ml-2 text-neutral-400 hover:text-[#914A8C] hover:bg-[#914A8C]/10 rounded-lg cursor-grab active:cursor-grabbing transition-colors shrink-0 mt-1 md:mt-0"
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Number Badge */}
        <div className="hidden md:flex shrink-0 w-8 h-8 rounded-full bg-[#914A8C]/10 text-[#914A8C] font-bold items-center justify-center text-sm border border-[#914A8C]/20">
          {index + 1}
        </div>

        {/* FAQ Content */}
        <div className="flex flex-col min-w-0">
          <h3 className="font-bold text-gray-900 truncate pr-4 text-base">
            {faq.question}
          </h3>
          <p className="text-gray-500 text-sm truncate mt-0.5">
            {faq.answer}
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3 shrink-0 ml-12 md:ml-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
        <div className="flex items-center gap-2 mr-2">
          <Switch
            checked={faq.isActive}
            onCheckedChange={() => onToggleStatus(faq.id)}
            disabled={isToggling}
            className="data-[state=checked]:bg-[#914A8C]"
          />
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wider min-w-[60px]",
              faq.isActive ? "text-[#914A8C]" : "text-gray-400"
            )}
          >
            {faq.isActive ? "Active" : "Hidden"}
          </span>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit(faq)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Edit FAQ"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => onDelete(faq)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Delete FAQ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
