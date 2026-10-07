"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * How far the pointer may travel before a press counts as a pan rather than a
 * click. Without a threshold, the tiny drift in an ordinary click would be read
 * as a drag and the click-to-toggle would never fire.
 */
const DRAG_THRESHOLD_PX = 4;

type Pan = { x: number; y: number };

interface PreviewZoomViewportProps {
  src: string;
  /** True pixel dimensions of the render — what actually goes to print. */
  naturalWidth: number;
  naturalHeight: number;
  alt: string;
}

/**
 * Clamps a pan offset so the image can never be dragged away from the viewport
 * edges, leaving empty gutters.
 *
 * Each axis is independent: a page can be taller than the viewport (pannable)
 * while still being narrower than it (nothing to pan, so it stays centred).
 */
function clampPan(
  pan: Pan,
  viewportWidth: number,
  viewportHeight: number,
  contentWidth: number,
  contentHeight: number,
): Pan {
  const clampAxis = (value: number, viewport: number, content: number) => {
    // Content smaller than the viewport has no slack — centre it and ignore
    // whatever the drag asked for.
    if (content <= viewport) return (viewport - content) / 2;
    // Otherwise the offset runs from "right/bottom edge flush" up to 0.
    return Math.min(0, Math.max(viewport - content, value));
  };

  return {
    x: clampAxis(pan.x, viewportWidth, contentWidth),
    y: clampAxis(pan.y, viewportHeight, contentHeight),
  };
}

/**
 * The preview image with click-to-zoom.
 *
 * Two states only: fit (whole page visible) and 1:1 (true print pixels).
 * 1:1 rather than an arbitrary multiplier because the question this preview
 * exists to answer is "will this text be right in the printed book" — and a 2×
 * blow-up of an already-downscaled render is interpolation, which cannot answer
 * that. At 1:1 the admin is looking at the actual output pixels.
 *
 * Clicking zooms to the clicked point and centres it, so the thing you wanted
 * to inspect lands in the middle rather than wherever the cursor happened to be.
 *
 * All interaction runs through pointer events, never a separate onClick. A
 * click handler would fire after the state change from pointerup and could read
 * the new state, toggling straight back — so press/move/release is the single
 * source of truth for both gestures.
 */
export function PreviewZoomViewport({
  src,
  naturalWidth,
  naturalHeight,
  alt,
}: PreviewZoomViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });

  // Drag bookkeeping lives in a ref, not state: it changes on every pointermove
  // and none of it should cost a render.
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPan: Pan;
    moved: boolean;
  } | null>(null);

  // NOTE ON RESETTING: a fresh render must not inherit the previous image's
  // zoom — the pan offset would point at meaningless coordinates on a page of
  // different dimensions. That reset is the caller's job, via a `key` that
  // changes per render, which remounts this component and clears all state.
  // Doing it here in an effect would mean an extra cascading render, and React
  // lints against it for exactly that reason.

  // While zoomed, Escape means "back to fit", not "close the preview". Captured
  // on the document so it runs before the dialog's own Escape handling.
  useEffect(() => {
    if (!isZoomed) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setIsZoomed(false);
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isZoomed]);

  /**
   * Zooms to 1:1 with the clicked point centred in the viewport.
   *
   * Walks the click from screen coordinates back to natural image pixels: the
   * image is letterboxed inside the viewport when fitted, so the offset of that
   * letterbox has to come out before dividing by the fit scale.
   */
  const zoomToPoint = (clientX: number, clientY: number) => {
    const el = viewportRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const fitScale = Math.min(
      rect.width / naturalWidth,
      rect.height / naturalHeight,
      // Never scale a small page UP to fit — that would make the fit view
      // blurrier than the 1:1 view it is supposed to contrast with.
      1,
    );

    const fittedWidth = naturalWidth * fitScale;
    const fittedHeight = naturalHeight * fitScale;
    const letterboxX = (rect.width - fittedWidth) / 2;
    const letterboxY = (rect.height - fittedHeight) / 2;

    const naturalX = (clientX - rect.left - letterboxX) / fitScale;
    const naturalY = (clientY - rect.top - letterboxY) / fitScale;

    setPan(
      clampPan(
        { x: rect.width / 2 - naturalX, y: rect.height / 2 - naturalY },
        rect.width,
        rect.height,
        naturalWidth,
        naturalHeight,
      ),
    );
    setIsZoomed(true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Capture so a drag that leaves the viewport still delivers move/up here,
    // rather than stranding the gesture mid-pan.
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPan: pan,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    // Tracked even in fit view, so a drag there is not mistaken for a click.
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
    }

    if (!isZoomed || !drag.moved) return;

    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    setPan(
      clampPan(
        { x: drag.startPan.x + dx, y: drag.startPan.y + dy },
        rect.width,
        rect.height,
        naturalWidth,
        naturalHeight,
      ),
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.pointerId !== e.pointerId) return;

    // A release that travelled is the end of a pan, not a click.
    if (drag.moved) return;

    if (isZoomed) setIsZoomed(false);
    else zoomToPoint(e.clientX, e.clientY);
  };

  const handlePointerCancel = () => {
    dragRef.current = null;
  };

  return (
    <div
      ref={viewportRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={cn(
        // touch-none stops a pan gesture from scrolling the dialog underneath.
        "relative w-full h-[55vh] overflow-hidden rounded-xl bg-neutral-100 select-none touch-none",
        isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
      )}
    >
      {isZoomed ? (
        <Image
          src={src}
          alt={alt}
          width={naturalWidth}
          height={naturalHeight}
          unoptimized
          draggable={false}
          className="block"
          style={{
            position: "absolute",
            left: pan.x,
            top: pan.y,
            width: naturalWidth,
            height: naturalHeight,
            // Defeats any inherited max-width — at 1:1 the image must be
            // allowed to overflow the viewport, that is the point.
            maxWidth: "none",
          }}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={naturalWidth}
          height={naturalHeight}
          unoptimized
          draggable={false}
          className="absolute inset-0 m-auto block w-auto h-auto max-w-full max-h-full object-contain"
        />
      )}

      {/* Affordance. Nothing about a static image says it is clickable, and an
          admin who does not know this is here will never find it. */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900/70 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
        {isZoomed
          ? "Drag to pan · click or Esc to fit"
          : "Click anywhere to zoom to actual print size"}
      </div>
    </div>
  );
}
