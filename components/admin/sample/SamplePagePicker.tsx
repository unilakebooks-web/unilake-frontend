"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Check, ImageIcon, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Page } from "@/app/types/comic";
import { MAX_SAMPLE_PAGES } from "./sampleConfig";
import {
  SamplePageImage,
  SamplePagePreviewDialog,
} from "./SamplePagePreviewDialog";

/**
 * Why a page cannot be generated, or null when it can. A page without artwork, or a face page without
 * its mask and prompt, cannot be generated (the worker would fail it after its retries). Same rule as
 * createSample in the backend (sampleBook.service.ts); the tile, the quick pick and the dialog all
 * use this one function.
 */
function pageProblem(p: Page): "no artwork" | "needs mask" | null {
  const hasArtwork = !!(p.artworkUrl && p.artworkWidth && p.artworkHeight);
  if (!hasArtwork) return "no artwork";
  if (p.hasFace && !(p.maskUrl && p.pagePrompt)) return "needs mask";
  return null;
}

const pageLabel = (p: Page) =>
  pageProblem(p) ?? (p.hasFace ? "with face" : "no face");

interface SamplePagePickerProps {
  /** The pages of the chosen book, sorted by page number. */
  pages: Page[];
  chosen: string[];
  /** The card's `setChosen`: updates are functional, as the old toggle was, so two quick clicks never overwrite each other. */
  onChange: Dispatch<SetStateAction<string[]>>;
  /** True while the sample is being created: nothing can be chosen or removed. */
  disabled?: boolean;
}

export function SamplePagePicker({
  pages,
  chosen,
  onChange,
  disabled = false,
}: SamplePagePickerProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const atCap = chosen.length >= MAX_SAMPLE_PAGES;
  const usablePages = pages.filter((p) => !pageProblem(p));
  const previewPages = usablePages.filter((p) => p.isPreviewPage);

  const togglePage = (id: string) => {
    if (disabled) return;
    // At the cap a click on another page changes nothing, and keeps the note.
    if (!chosen.includes(id) && chosen.length >= MAX_SAMPLE_PAGES) return;
    setNote(null);
    // `current` can still hold a page that was deleted elsewhere: only the pages of this book count.
    const known = new Set(pages.map((p) => p.id));
    onChange((all) => {
      const current = all.filter((x) => known.has(x));
      return current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length >= MAX_SAMPLE_PAGES
          ? current
          : [...current, id];
    });
  };

  const pickFreePreview = () => {
    if (disabled) return;
    const ids = previewPages.slice(0, MAX_SAMPLE_PAGES).map((p) => p.id);
    onChange(ids);
    setNote(
      previewPages.length > MAX_SAMPLE_PAGES
        ? `Showing the first ${MAX_SAMPLE_PAGES} of ${previewPages.length} free-preview pages.`
        : null,
    );
  };

  // Every page that can be generated, up to the ceiling. Pages without artwork (or a face page without
  // its mask) are left out and the note says how many.
  const selectAll = () => {
    if (disabled) return;
    onChange(usablePages.slice(0, MAX_SAMPLE_PAGES).map((p) => p.id));
    const skipped = pages.length - usablePages.length;
    const notes = [
      skipped > 0
        ? `Skipped ${skipped} page(s) that cannot be generated.`
        : null,
      usablePages.length > MAX_SAMPLE_PAGES
        ? `Chose the first ${MAX_SAMPLE_PAGES} of ${usablePages.length} pages.`
        : null,
    ].filter(Boolean);
    setNote(notes.length > 0 ? notes.join(" ") : null);
  };

  const deselectAll = () => {
    if (disabled) return;
    onChange([]);
    setNote(null);
  };

  const openPage = pages.find((p) => p.id === openId);
  const openSelected = !!openPage && chosen.includes(openPage.id);

  return (
    <div className="space-y-3 rounded-xl border border-[#914A8C]/20 p-2 sm:p-3">
      {/* The status region is always in the page (never display:none), so a screen reader announces
          what is put into it. With nothing to say the row is empty. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="status" className="text-xs font-semibold text-[#914A8C]/80">
          {atCap && pages.length > MAX_SAMPLE_PAGES ? (
            <p>{MAX_SAMPLE_PAGES} pages chosen. Remove one to add another.</p>
          ) : null}
          {note && <p>{note}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={selectAll}
          disabled={disabled || usablePages.length === 0}
          className="ml-auto cursor-pointer"
        >
          Select all
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={deselectAll}
          disabled={disabled || chosen.length === 0}
          className="cursor-pointer"
        >
          Deselect all
        </Button>
        {previewPages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={pickFreePreview}
            disabled={disabled}
            className="cursor-pointer"
          >
            Select free-preview pages
          </Button>
        )}
      </div>

      <div className="max-h-[min(26rem,60vh)] overflow-y-auto p-1">
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
          {pages.map((p) => {
            const problem = pageProblem(p);
            const on = chosen.includes(p.id);
            // At the cap, and while the sample is being created, the tiles look off but stay focusable
            // (aria-disabled), so a keyboard user can still reach them and the magnifier.
            const dim = (atCap && !on) || disabled;
            // A page with artwork is drawn even when it needs a mask (greyed), so the admin can see it.
            const showPicture = !!p.artworkUrl && problem !== "no artwork";
            return (
              <div key={p.id} className="relative">
                <button
                  type="button"
                  onClick={() => togglePage(p.id)}
                  // A page that is already chosen can always be removed, even if a refetch made it unusable.
                  disabled={!!problem && !on}
                  aria-pressed={on}
                  aria-disabled={dim || undefined}
                  aria-label={`Page ${p.pageNumber}, ${pageLabel(p)}`}
                  className={`block w-full rounded-xl border-2 p-1 text-left disabled:cursor-not-allowed ${
                    on
                      ? "border-[#914A8C] bg-[#914A8C]/10 ring-2 ring-[#914A8C]/30"
                      : "border-[#914A8C]/20 bg-white"
                  } ${dim ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span
                    className={`relative block aspect-square w-full overflow-hidden rounded-lg bg-neutral-100 ${
                      problem ? "opacity-50 grayscale" : dim ? "opacity-60" : ""
                    }`}
                  >
                    {showPicture && p.artworkUrl ? (
                      <SamplePageImage
                        key={p.artworkUrl}
                        url={p.artworkUrl}
                        size={192}
                        alt=""
                        className="h-full w-full"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-neutral-400">
                        <ImageIcon className="w-6 h-6" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-[#914A8C] px-1.5 py-0.5 text-[11px] font-black text-white">
                    {on && <Check className="w-3 h-3" aria-hidden="true" />}
                    {p.pageNumber}
                  </span>
                  <span className="absolute bottom-2 left-2 right-2 rounded bg-white px-1 py-0.5 text-center text-[10px] font-bold text-[#914A8C]">
                    {pageLabel(p)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(p.id)}
                  aria-label={`Enlarge page ${p.pageNumber}`}
                  className="absolute top-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-[#914A8C] shadow focus-visible:ring-2 focus-visible:ring-[#914A8C]/50"
                >
                  <ZoomIn className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <SamplePagePreviewDialog
        page={openPage}
        label={openPage ? pageLabel(openPage) : ""}
        showPicture={!!openPage && pageProblem(openPage) !== "no artwork"}
        selected={openSelected}
        blockedReason={
          openPage
            ? (pageProblem(openPage) ??
              (atCap ? `${MAX_SAMPLE_PAGES} pages chosen` : null))
            : null
        }
        busy={disabled}
        onToggle={() => openPage && togglePage(openPage.id)}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}
