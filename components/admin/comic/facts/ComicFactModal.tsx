"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { CharCounter } from "@/components/admin/shared/CharCounter";
import type { ComicFactPlacement } from "@/app/types/comic";

/** Matches the backend validator's cap; the counter warns at the same number. */
const FACT_MAX_LENGTH = 200;

const PLACEMENT_COPY: Record<ComicFactPlacement, string> = {
  PRELOADER: "the loading screen, while the first pages are being prepared",
  GENERATING: "each page while its artwork is being generated",
};

interface ComicFactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  /** Inherited from whichever list the admin is in; not editable here. */
  placement: ComicFactPlacement;
  initialText: string;
  onSave: (text: string) => Promise<void>;
}

export function ComicFactModal({
  open,
  onOpenChange,
  mode,
  placement,
  initialText,
  onSave,
}: ComicFactModalProps) {
  const [text, setText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Re-seed each time the dialog opens — the same component instance is reused
  // for every row, so stale text would otherwise carry over between edits.
  //
  // Done during render on the open/close transition rather than in an effect:
  // an effect would paint the previous row's text for one frame before
  // replacing it, which is visible when editing two facts in a row.
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setText(initialText);
      setError("");
      setIsSaving(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = text.trim();

    if (!trimmed) {
      setError("Please write the fact first.");
      return;
    }
    if (trimmed.length > FACT_MAX_LENGTH) {
      setError(`Facts must be ${FACT_MAX_LENGTH} characters or less.`);
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onSave(trimmed);
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isSaving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-900">
            {mode === "create" ? "Add a fact" : "Edit fact"}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            Shown on {PLACEMENT_COPY[placement]}. Keep it to one short sentence —
            it is on screen for about five seconds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isSaving}
            rows={3}
            autoFocus
            maxLength={FACT_MAX_LENGTH}
            placeholder="Did you know? Every comic is printed on thick, child-proof paper."
            className="rounded-xl bg-white resize-none"
          />

          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold text-red-600 min-h-4">{error}</p>
            <CharCounter value={text} limit={FACT_MAX_LENGTH} />
          </div>

          <DialogFooter className="gap-2 sm:justify-end pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-xl border border-neutral-300 px-5 h-11 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#914A8C] px-6 h-11 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#7a3e75] disabled:opacity-50 inline-flex items-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : mode === "create" ? (
                "Add fact"
              ) : (
                "Save changes"
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
