"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Save, CheckCircle2 } from "lucide-react";

interface SaveOrderButtonProps {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export function SaveOrderButton({ isDirty, isSaving, onSave }: SaveOrderButtonProps) {
  return (
    <Button
      onClick={onSave}
      disabled={!isDirty || isSaving}
      className={`
        h-10 px-5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 text-sm shadow-sm
        ${
          isDirty
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25 shadow-md animate-pulse hover:animate-none cursor-pointer scale-[1.02]"
            : "bg-neutral-200/80 text-neutral-400 border border-neutral-300/50 cursor-not-allowed"
        }
      `}
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Saving Order...</span>
        </>
      ) : isDirty ? (
        <>
          <Save className="w-4 h-4 animate-bounce" />
          <span>Save Order</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4 opacity-70" />
          <span>Order Saved</span>
        </>
      )}
    </Button>
  );
}
