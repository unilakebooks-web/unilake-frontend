"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RegenerateResponse, SessionPage } from "@/app/types/session";
import GeneratingPlaceholder from "./GeneratingPlaceholder";
import PageErrorPlaceholder from "./PageErrorPlaceholder";
import LockedPageOverlay from "./LockedPageOverlay";
import RegenerateSlide from "./RegenerateSlide";
import { PublicComicDetailPage } from "@/app/types/comic";

/**
 * Widest a page card is ever drawn, in px. The cap that applies to landscape
 * pages, where height is never the binding constraint.
 */
const PAGE_MAX_WIDTH_PX = 540;

/**
 * Tallest a page card is ever drawn, as a share of the viewport.
 *
 * This is what guarantees a whole page is visible at once. Width alone cannot:
 * a portrait page at 480px wide is ~720px tall, which does not fit a laptop
 * viewport, so the customer could never see a full page without scrolling.
 * Leaves room for the "Page N" label beneath and the page's own padding.
 */
const PAGE_MAX_HEIGHT_VH = 72;

interface PreviewPageCardProps {
  page: SessionPage;
  comicPageMetadata: PublicComicDetailPage | undefined;
  onRegenerate: (pageNumber: number) => Promise<RegenerateResponse | undefined>;
  isGeneratingSession: boolean;
  isPaid?: boolean;
  /**
   * Which variant this page is showing. Owned by the parent because send-to-print
   * needs one variant per page, and a card can't report state it keeps to itself.
   * Null while nothing has finished generating yet.
   */
  selectedVariantIndex: number | null;
  onVariantChange: (pageNumber: number, variantIndex: number) => void;
  /**
   * The rotating fact to show while this page generates. Owned by the parent so
   * every card on screen displays the same one at the same time.
   */
  generatingFact?: string;
  /**
   * The book has been sent to print. Shows only the variant that was printed —
   * no arrows, no thumbnails, no regenerate.
   */
  readOnly?: boolean;
  /**
   * False while the session is AWAITING_PAYMENT: the backend refuses to
   * regenerate there, so the regenerate slide is not offered. Variant browsing
   * still works.
   */
  canRegenerate?: boolean;
}

/** Variant caps — must match MAX_VARIANTS_BEFORE/AFTER_PAYMENT in the backend's config/generation.ts. */
const MAX_VARIANTS_BEFORE_PAYMENT = 3;
const MAX_VARIANTS_AFTER_PAYMENT = 8;

export default function PreviewPageCard({
  page,
  comicPageMetadata,
  onRegenerate,
  isGeneratingSession,
  isPaid,
  selectedVariantIndex,
  onVariantChange,
  generatingFact,
  readOnly = false,
  canRegenerate = true,
}: PreviewPageCardProps) {
  // Every variant is navigable, including ones still generating: a pending variant is
  // exactly what the user wants to see the status of after hitting regenerate.
  //
  // Read-only narrows that to the printed one. The fallback (newest finished)
  // only covers a session with no selection recorded, which send-to-print
  // should make impossible — but an empty card would be worse than a guess.
  const variants = readOnly
    ? (() => {
        const printed = page.variants.filter((v) => v.isSelected);
        if (printed.length > 0) return printed;
        return page.variants.filter((v) => v.status === "SD_READY").slice(-1);
      })()
    : page.variants;

  // Falls back to the first slot so a page with nothing ready yet still renders
  // its generating placeholder, matching the old local-state initialiser.
  const activeVariantIndex = readOnly
    ? (variants[0]?.variantIndex ?? 0)
    : (selectedVariantIndex ?? 0);
  const setActiveVariantIndex = (variantIndex: number) =>
    onVariantChange(page.pageNumber, variantIndex);

  const [showRegenerateSlide, setShowRegenerateSlide] = useState(false);
  const [isLoadingRegenerate, setIsLoadingRegenerate] = useState(false);

  // The variant this user just asked for. Set on a successful regenerate, cleared once
  // that variant lands. Only a variant the user personally requested auto-switches —
  // anything else arriving would yank the view away from what they chose to look at.
  const awaitedVariantRef = useRef<number | null>(null);

  const isLocked = isPaid ? false : !page.isPreviewPage;

  const maxRegenerations = isPaid ? MAX_VARIANTS_AFTER_PAYMENT : MAX_VARIANTS_BEFORE_PAYMENT;
  const triesLeft = maxRegenerations - variants.length;

  const regenerateAllowed = canRegenerate && !readOnly;
  const showNavigation = !isLocked && !readOnly;

  const activePosition = variants.findIndex((v) => v.variantIndex === activeVariantIndex);
  const canGoPrev = activePosition > 0 || showRegenerateSlide;
  const canGoNextNormal = activePosition >= 0 && activePosition < variants.length - 1;
  const canGoNextToRegenerate =
    regenerateAllowed && !isLocked && variants.length > 0 && activePosition === variants.length - 1;
  const canGoNext = !showRegenerateSlide && (canGoNextNormal || canGoNextToRegenerate);

  const currentVariant = variants.find((v) => v.variantIndex === activeVariantIndex);
  // FAILED is terminal: the backend only writes it once every BullMQ retry is
  // spent. Until this split existed, every non-SD_READY status read as
  // "generating" and a dead page spun forever.
  const hasFailed = !isLocked && currentVariant?.status === "FAILED";
  const isGenerating =
    !isLocked && !hasFailed && currentVariant?.status !== "SD_READY";
  // Prefer the web derivative; fall back to the print master for variants that
  // predate it or whose derivative failed to build.
  const imageUrl =
    !isLocked && currentVariant?.status === "SD_READY"
      ? currentVariant.displayImageUrl ?? currentVariant.finalImageUrl
      : null;

  // Watch for the requested variant finishing, then reveal it.
  useEffect(() => {
    const awaited = awaitedVariantRef.current;
    if (awaited === null) return;

    const variant = page.variants.find((v) => v.variantIndex === awaited);
    if (variant?.status !== "SD_READY") return;

    awaitedVariantRef.current = null;
    onVariantChange(page.pageNumber, awaited);
    setShowRegenerateSlide(false);
    toast.success(`Page ${page.pageNumber}: your new version is ready`);
  }, [page.variants, page.pageNumber, onVariantChange]);

  const handleRegenerate = async () => {
    if (isLoadingRegenerate) return;
    setIsLoadingRegenerate(true);
    try {
      const res = await onRegenerate(page.pageNumber);
      if (!res) return;

      awaitedVariantRef.current = res.variantIndex;
      setActiveVariantIndex(res.variantIndex);
      setShowRegenerateSlide(false);
    } catch (error) {
      const message = (error as { message?: string } | null)?.message;
      toast.error(message || "Failed to start regeneration");
    } finally {
      setIsLoadingRegenerate(false);
    }
  };

  const step = (direction: -1 | 1) => {
    if (showRegenerateSlide && direction === -1) {
      setShowRegenerateSlide(false);
      const lastVariant = variants[variants.length - 1];
      if (lastVariant) setActiveVariantIndex(lastVariant.variantIndex);
      return;
    }
    
    if (!showRegenerateSlide && direction === 1 && activePosition === variants.length - 1) {
      setShowRegenerateSlide(true);
      return;
    }

    const next = variants[activePosition + direction];
    if (next) {
      setActiveVariantIndex(next.variantIndex);
      setShowRegenerateSlide(false);
    }
  };

  // The session snapshot carries dimensions for EVERY page; comicDetail only
  // covers preview pages, which is why a locked card used to fall through to a
  // 1024-square box and render the wrong shape. Snapshot first, comicDetail
  // kept as a fallback so nothing regresses if the frontend ships ahead of the
  // backend that added these fields.
  const width = page.artworkWidth ?? comicPageMetadata?.artworkWidth ?? 1024;
  const height = page.artworkHeight ?? comicPageMetadata?.artworkHeight ?? 1024;
  const aspectRatio = width / height;

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#FFD54A] text-[#3F3C95] " +
    "flex items-center justify-center shadow-md border-2 border-[#3F3C95] transition-all " +
    "hover:brightness-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none";

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[780px] mx-auto py-4">
      {/* Width is bounded by BOTH the px cap and the viewport height, whichever
          binds first for this page's shape.

          `aspectRatio * 65vh` is the width at which this page would be exactly
          65vh tall, so taking the min with the px cap means a portrait page
          shrinks until it fits the screen while a landscape one simply stops at
          480px. Done here rather than with a CSS max-height because the ratio
          is only known in JS, and a max-height on an aspect-ratio box clips
          rather than scales. */}
      <div
        className="flex flex-col items-center w-full"
        style={{
          maxWidth: `min(${PAGE_MAX_WIDTH_PX}px, calc(${aspectRatio} * ${PAGE_MAX_HEIGHT_VH}vh))`,
        }}
      >
        <div className="relative w-full">
          <div
            className="relative w-full rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-slate-100 ring-1 ring-black/5"
            style={
              !isLocked && !showRegenerateSlide && !isGenerating && imageUrl
                ? undefined
                : { aspectRatio }
            }
          >
            {isLocked && (
              <LockedPageOverlay
                artworkUrl={page.artworkUrl}
                pageNumber={page.pageNumber}
              />
            )}

            {!isLocked && showRegenerateSlide && (
              <RegenerateSlide
                onRegenerate={handleRegenerate}
                isLoading={isLoadingRegenerate}
                isGenerating={isGeneratingSession}
                triesLeft={triesLeft}
              />
            )}

            {!isLocked && !showRegenerateSlide && isGenerating && (
              <GeneratingPlaceholder fact={generatingFact} />
            )}

            {/* After showRegenerateSlide, so navigating to the regenerate slide
                still works from a failed page — which is what the copy tells
                the user to do. */}
            {!isLocked && !showRegenerateSlide && hasFailed && (
              <PageErrorPlaceholder />
            )}

            {!isLocked && !showRegenerateSlide && !isGenerating && imageUrl && (
              <img
                src={imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="w-full h-auto block"
              />
            )}
          </div>

          {/* Variant navigation */}
          {showNavigation && (variants.length > 1 || canGoNextToRegenerate) && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={!canGoPrev}
                aria-label="Previous version of this page"
                className={`${arrowClass} left-0 -translate-x-1/2`}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={!canGoNext}
                aria-label="Next version of this page"
                className={`${arrowClass} right-0 translate-x-1/2`}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        <div className="mt-4 font-bold text-gray-400 uppercase tracking-widest text-sm">
          Page {page.pageNumber}
          {!isLocked && !showRegenerateSlide && variants.length > 1 && (
            <span className="ml-2 normal-case tracking-normal text-gray-400">
              · version {activePosition + 1} of {variants.length}
            </span>
          )}
        </div>
      </div>

      {showNavigation && variants.length > 0 && (
        <div className="flex flex-row lg:flex-col items-center gap-3 mt-4 lg:mt-0 overflow-x-auto lg:absolute lg:top-12 lg:right-4 w-full lg:w-auto p-2">
          {variants.map((variant) => {
            const isReady = variant.status === "SD_READY";
            const variantFailed = variant.status === "FAILED";
            const thumbUrl = variant.displayImageUrl ?? variant.finalImageUrl;
            const isActive = !showRegenerateSlide && activeVariantIndex === variant.variantIndex;
            return (
              <button
                key={variant.pageVersionId}
                onClick={() => {
                  setActiveVariantIndex(variant.variantIndex);
                  setShowRegenerateSlide(false);
                }}
                title={
                  isReady
                    ? `Version ${variant.variantIndex + 1}`
                    : variantFailed
                      ? "This version couldn't be created"
                      : "Still generating..."
                }
                className={`relative w-16 h-16 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                  isActive
                    ? "border-[#3F3C95] shadow-sm scale-110 z-10"
                    : "border-transparent hover:border-gray-300 opacity-70 hover:opacity-100"
                }`}
              >
                {isReady && thumbUrl ? (
                  <>
                    <Image
                      src={thumbUrl}
                      alt={`Version ${variant.variantIndex + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                    />
                    <div className="absolute bottom-1 right-1 bg-white/90 px-1 rounded text-[10px] font-bold text-[#3F3C95] shadow-sm">
                      V{variant.variantIndex + 1}
                    </div>
                  </>
                ) : variantFailed ? (
                  // Without this branch a dead variant spins here forever, the
                  // same bug the main card had.
                  <span className="absolute inset-0 flex items-center justify-center bg-amber-50 text-amber-600">
                    <AlertTriangle size={18} />
                  </span>
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center bg-gray-100 text-[#3F3C95]">
                    <Loader2 size={18} className="animate-spin" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
