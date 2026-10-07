"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Palette, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Theme } from "@/app/types/theme";

interface ThemeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData: Theme | null;
  onSave: (name: string) => Promise<void>;
}

export function ThemeModal({
  open,
  onOpenChange,
  mode,
  initialData,
  onSave,
}: ThemeModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setName(initialData.name);
      } else {
        setName("");
      }
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [open, mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Theme name cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSave(trimmedName);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.message || "Failed to save theme";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-[#914A8C]/20 shadow-xl rounded-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#914A8C]">
                {mode === "create" ? "Add New Theme" : "Edit Theme"}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#914A8C]/70 font-medium">
                {mode === "create"
                  ? "Create a new category for your comics."
                  : "Update the name of this theme."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-800 block">
              Theme Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Space Adventure"
              disabled={isSubmitting}
              className="h-11 px-3.5 text-sm rounded-xl border-[#914A8C]/30 focus-visible:border-[#914A8C] focus-visible:ring-[#914A8C]/30 bg-[#F8E7D2]/20 text-neutral-900"
              maxLength={100}
              autoFocus
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-semibold h-10 px-6 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Create Theme"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
