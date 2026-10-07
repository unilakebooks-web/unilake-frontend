"use client";

import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveOrderButton } from "./SaveOrderButton";

interface AnnouncementPageHeaderProps {
  onAddClick: () => void;
  isOrderDirty: boolean;
  isSavingOrder: boolean;
  onSaveOrder: () => void;
}

export function AnnouncementPageHeader({
  onAddClick,
  isOrderDirty,
  isSavingOrder,
  onSaveOrder,
}: AnnouncementPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#914A8C]/15 mb-6">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-[#914A8C] text-[#FFD54A] flex items-center justify-center shadow-md shadow-[#914A8C]/20 shrink-0">
          <Megaphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">
            Announcement Bar
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#914A8C]/75">
            Manage storefront marketing tickers. Drag rows by the grip to reorder rotation.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <SaveOrderButton
          isDirty={isOrderDirty}
          isSaving={isSavingOrder}
          onSave={onSaveOrder}
        />

        <Button
          onClick={onAddClick}
          className="h-10 px-5 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm shadow-md shadow-[#914A8C]/20 flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Announcement</span>
        </Button>
      </div>
    </div>
  );
}
