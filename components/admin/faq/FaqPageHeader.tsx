import { SaveOrderButton } from "@/components/admin/announcement/SaveOrderButton";
import { Plus } from "lucide-react";

interface FaqPageHeaderProps {
  onAddClick: () => void;
  isOrderDirty: boolean;
  isSavingOrder: boolean;
  onSaveOrder: () => void;
}

export function FaqPageHeader({
  onAddClick,
  isOrderDirty,
  isSavingOrder,
  onSaveOrder,
}: FaqPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-[#914A8C]/15 mb-4">
      <div>
        <h1 className="text-2xl font-black text-[#914A8C] mb-1">Frequently Asked Questions</h1>
        <p className="text-gray-500 font-medium text-sm">
          Manage questions and answers displayed on the storefront.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Reusing the SaveOrderButton from the announcement module for consistency */}
        <SaveOrderButton
          isDirty={isOrderDirty}
          isSaving={isSavingOrder}
          onSave={onSaveOrder}
        />
        
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 bg-[#914A8C] hover:bg-[#7A3E76] text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Add FAQ</span>
        </button>
      </div>
    </div>
  );
}
