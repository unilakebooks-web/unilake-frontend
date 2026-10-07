"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedControl } from "./SegmentedControl";
import { PreviewZoomViewport } from "./PreviewZoomViewport";
import { usePreviewPageStamp } from "@/hooks/usePages";
import { SAMPLE_NAMES } from "@/lib/dialogueTokens";
import type {
  PreviewPronounKey,
  PreviewStampBubble,
} from "@/app/types/comic";

const PRONOUN_OPTIONS: { value: PreviewPronounKey; label: string }[] = [
  { value: "HE", label: "He" },
  { value: "SHE", label: "She" },
  { value: "THEY", label: "They" },
];

interface BubblePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  pageNumber: number;
  /**
   * The bubbles exactly as they stand on screen, deleted ones already removed.
   * Passed in rather than fetched so the preview reflects unsaved edits — the
   * whole point of the feature.
   */
  bubbles: PreviewStampBubble[];
}

/**
 * Shows the REAL backend text render of a page: actual fonts, actual glyph
 * widths, actual auto-shrink, name colour included.
 *
 * The mapping canvas now draws with a copy of the same layout
 * (lib/bubbleLayout.ts), so this should agree with it. This is the final check
 * against the real renderer itself, and the only place to try any name and
 * pronoun.
 *
 * Text only — the face swap is a separate pipeline stage and is not involved.
 * For a page with hasFace off, this is pixel-identical to what prints.
 */
export function BubblePreviewModal({
  open,
  onOpenChange,
  pageId,
  pageNumber,
  bubbles,
}: BubblePreviewModalProps) {
  const [childName, setChildName] = useState(SAMPLE_NAMES.long);
  const [pronounKey, setPronounKey] = useState<PreviewPronounKey>("THEY");

  const preview = usePreviewPageStamp();
  const { mutate, reset } = preview;

  // Render once on open. Deliberately not re-rendering on every keystroke:
  // each render is a real Sharp composite plus font downloads from R2, so it
  // is driven by an explicit Refresh instead.
  useEffect(() => {
    if (!open) return;
    mutate({ pageId, data: { childName, pronounKey, bubbles } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pageId]);

  // Drop the previous image when the modal closes, so reopening never shows a
  // stale render from an earlier set of bubbles.
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleRefresh = () => {
    if (!childName.trim()) return;
    mutate({ pageId, data: { childName: childName.trim(), pronounKey, bubbles } });
  };

  const errorMessage =
    preview.error && typeof preview.error === "object" && "message" in preview.error
      ? String((preview.error as { message?: string }).message)
      : "Failed to render the preview.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">
            Preview — Page {pageNumber}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500">
            Final check with the real print renderer. No face swap. Nothing is saved.
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 sm:items-end">
          <div className="space-y-1.5 min-w-0">
            <Label className="text-xs font-semibold text-neutral-700">
              Child&apos;s name
            </Label>
            <Input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRefresh();
              }}
              placeholder="Type a name to test"
              maxLength={50}
              className="h-9 text-xs rounded-xl bg-neutral-50 border-neutral-200"
            />
          </div>

          <div className="min-w-0 sm:w-48">
            <SegmentedControl
              label="Pronoun"
              value={pronounKey}
              options={PRONOUN_OPTIONS}
              onChange={setPronounKey}
              disabled={preview.isPending}
            />
          </div>

          <Button
            type="button"
            onClick={handleRefresh}
            disabled={preview.isPending || !childName.trim()}
            className="h-9 rounded-xl bg-[#914A8C] hover:bg-[#7A3E76] text-white font-semibold px-4 cursor-pointer"
          >
            {preview.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rendering
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>

        {/* Result */}
        <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 min-h-[320px] flex items-center justify-center">
          {preview.isPending ? (
            <div className="flex flex-col items-center gap-2 text-neutral-500">
              <Loader2 className="w-7 h-7 animate-spin" />
              <p className="text-xs font-medium">Rendering with real fonts…</p>
            </div>
          ) : preview.isError ? (
            /* The renderer fails loudly on a bad font, a missing glyph or a
               bubble without a font — the same failure a real generation job
               would hit. Showing it verbatim is the point: this is where the
               admin is meant to find out, not on a printed book. */
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm font-bold text-red-800">
                Could not render this page
              </p>
              <p className="text-xs text-red-700 max-w-md">{errorMessage}</p>
            </div>
          ) : preview.data ? (
            /* Fitted into a fixed-height viewport rather than rendered at full
               width: a tall page used to run past the bottom of the dialog and
               force it to scroll. The viewport also carries click-to-zoom, so
               shrinking it here costs no detail — 1:1 inspection is a click
               away. */
            <PreviewZoomViewport
              /* Remounts on every new render, which is what clears any zoom
                 and pan left over from the previous image. Keyed on the
                 submission timestamp rather than the image itself: the data
                 URI is megabytes, and this component re-renders on every
                 keystroke in the name field. */
              key={preview.submittedAt}
              src={preview.data.image}
              naturalWidth={preview.data.artworkWidth}
              naturalHeight={preview.data.artworkHeight}
              alt={`Rendered preview of page ${pageNumber}`}
            />
          ) : (
            <p className="text-xs text-neutral-400">No preview yet.</p>
          )}
        </div>

        <p className="text-[10px] text-neutral-400 leading-relaxed">
          This uses the same renderer as the real generation, so text that
          overflows its bubble will be cut off here exactly as it would be in
          print.
        </p>
      </DialogContent>
    </Dialog>
  );
}
