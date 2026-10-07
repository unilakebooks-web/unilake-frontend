"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Megaphone } from "lucide-react";

interface AnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialMessage?: string;
  onSave: (message: string) => Promise<void>;
}

export function AnnouncementModal({
  open,
  onOpenChange,
  mode,
  initialMessage = "",
  onSave,
}: AnnouncementModalProps) {
  const [message, setMessage] = useState(initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setMessage(initialMessage || "");
      setError("");
      setIsSubmitting(false);
    }
  }, [open, initialMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Announcement message cannot be empty.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSave(trimmed);
      onOpenChange(false);
    } catch {
      // Parent component handles showing error toast; stay open on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white border border-[#914A8C]/20 shadow-xl rounded-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#914A8C]">
                {mode === "create" ? "Add New Announcement" : "Edit Announcement"}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#914A8C]/70 font-medium">
                {mode === "create"
                  ? "New announcements start in Hidden (inactive) status by default."
                  : "Update the marketing message displayed in the top bar."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-semibold text-neutral-800 block">
              Message Text <span className="text-red-500">*</span>
            </label>
            <Input
              id="message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (error && e.target.value.trim()) setError("");
              }}
              placeholder="e.g. Free shipping on all orders above ₹999!"
              disabled={isSubmitting}
              className="h-11 px-3.5 text-sm rounded-xl border-[#914A8C]/30 focus-visible:border-[#914A8C] focus-visible:ring-[#914A8C]/30 bg-[#F8E7D2]/20 text-neutral-900"
              autoFocus
            />
            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
            <p className="text-[11px] text-neutral-500 flex justify-between">
              <span>Keep it concise for mobile displays.</span>
              <span className="font-mono">{message.length} chars</span>
            </p>
          </div>

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
              disabled={isSubmitting || !message.trim()}
              className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-semibold h-10 px-6 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Create Announcement"
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
