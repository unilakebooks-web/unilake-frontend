"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Text, Group, Shape } from "react-konva";
import type Konva from "konva";
import useImage from "use-image";
import type { PathCommand } from "opentype.js";
import { LocalBubble } from "./BubbleSidebar";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_COLOR,
  clampRect,
  normalizedToPixel,
  pixelToNormalized,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_TEXT_VERTICAL_ALIGN,
  DEFAULT_TEXT_CASE,
} from "./bubbleCoordinates";
import { layoutBubble, type BubbleLayout } from "@/lib/bubbleLayout";
import type { FontFileState } from "@/hooks/useFontFiles";

const SELECTED_STROKE = "#914A8C";
const IDLE_STROKE = "#999";
const PROBLEM_STROKE = "#dc2626";

interface BubbleMapperCanvasProps {
  artworkUrl: string | null;
  /**
   * The artwork's real pixel size from the DB (Sharp-probed on upload) — the
   * same numbers the print renderer lays text out against. Null only on pages
   * uploaded before probing existed; the loaded image's size is used then.
   */
  artworkWidth: number | null;
  artworkHeight: number | null;
  bubbles: LocalBubble[];
  /** Parsed fonts by id, for drawing text exactly as it prints. */
  fontStates: Map<string, FontFileState>;
  selectedBubbleId: string | null;
  /**
   * Sample child name substituted into `{name}` for the on-canvas preview, so
   * the admin sizes bubbles against a realistic name instead of the literal
   * token. Comes from the page's Short/Long toggle — the same one driving the
   * sidebar preview.
   */
  previewName: string;
  onSelectBubble: (id: string | null) => void;
  onUpdateBubble: (id: string, updates: Partial<LocalBubble>) => void;
}

/** Size of a bubble while its resize handle is being dragged, in display px. */
type LiveSize = { id: string; widthPx: number; heightPx: number };

export function BubbleMapperCanvas({
  artworkUrl,
  artworkWidth,
  artworkHeight,
  bubbles,
  fontStates,
  selectedBubbleId,
  previewName,
  onSelectBubble,
  onUpdateBubble,
}: BubbleMapperCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const [image] = useImage(artworkUrl || "");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, scale: 1, imageWidth: 0, imageHeight: 0 });

  // Live resize: the size being dragged, re-laid-out at most once per frame.
  const [liveSize, setLiveSize] = useState<LiveSize | null>(null);
  const pendingLiveRef = useRef<LiveSize | null>(null);
  const liveFrameRef = useRef<number | null>(null);

  const scheduleLiveSize = useCallback((next: LiveSize) => {
    pendingLiveRef.current = next;
    if (liveFrameRef.current !== null) return;
    liveFrameRef.current = requestAnimationFrame(() => {
      liveFrameRef.current = null;
      setLiveSize(pendingLiveRef.current);
    });
  }, []);

  const clearLiveSize = useCallback(() => {
    if (liveFrameRef.current !== null) cancelAnimationFrame(liveFrameRef.current);
    liveFrameRef.current = null;
    pendingLiveRef.current = null;
    setLiveSize(null);
  }, []);

  useEffect(() => () => {
    if (liveFrameRef.current !== null) cancelAnimationFrame(liveFrameRef.current);
  }, []);

  // Handle Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && image) {
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;

        // Calculate scale to fit image within container
        const imgRatio = image.width / image.height;
        const containerRatio = containerW / containerH;

        let targetW, targetH;

        if (imgRatio > containerRatio) {
          targetW = containerW - 40; // 20px padding
          targetH = targetW / imgRatio;
        } else {
          targetH = containerH - 40;
          targetW = targetH * imgRatio;
        }

        setDimensions({
          width: containerW,
          height: containerH,
          scale: targetW / image.width,
          imageWidth: targetW,
          imageHeight: targetH
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [image]);

  // Handle Transformer Selection
  useEffect(() => {
    if (selectedBubbleId && trRef.current && stageRef.current) {
      const node = stageRef.current.findOne(`#bubble-${selectedBubbleId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedBubbleId, bubbles]);

  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // deselect when clicked on empty area or image
    const clickedOnEmpty = e.target === e.target.getStage();
    const clickedOnImage = e.target.name() === 'backgroundImage';
    if (clickedOnEmpty || clickedOnImage) {
      onSelectBubble(null);
    }
  };

  if (!artworkUrl) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-100 rounded-3xl border border-neutral-200 m-4 shadow-inner">
        <p className="text-neutral-500 font-medium">No artwork uploaded for this page.</p>
      </div>
    );
  }

  // Calculate centered position
  const offsetX = (dimensions.width - dimensions.imageWidth) / 2;
  const offsetY = (dimensions.height - dimensions.imageHeight) / 2;

  const activeBubbles = bubbles.filter(b => !b.isDeleted);

  // The print renderer lays out against the DB's artwork size. Fall back to the
  // loaded image only for legacy pages that were never probed.
  const layoutArtworkWidth = artworkWidth ?? image?.width ?? 0;
  const layoutArtworkHeight = artworkHeight ?? image?.height ?? 0;

  return (
    <div className="flex-1 relative bg-neutral-100 rounded-3xl overflow-hidden shadow-inner m-4 border border-neutral-200" ref={containerRef}>
      {dimensions.width > 0 && image && (
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
          ref={stageRef}
        >
          <Layer>
            {/* Centered Image */}
            <Group x={offsetX} y={offsetY}>
              <KonvaImage
                image={image}
                width={dimensions.imageWidth}
                height={dimensions.imageHeight}
                name="backgroundImage"
              />

              {/* Bubbles */}
              {activeBubbles.map((bubble) => {
                // Convert normalized values to pixel values based on current image render size
                const x = normalizedToPixel(bubble.x || 0.1, 0, image.width, dimensions.imageWidth);
                const y = normalizedToPixel(bubble.y || 0.1, 0, image.height, dimensions.imageHeight);
                const storedWidth = normalizedToPixel(bubble.width || 0.2, 0, image.width, dimensions.imageWidth);
                const storedHeight = normalizedToPixel(bubble.height || 0.1, 0, image.height, dimensions.imageHeight);

                // While this bubble's resize handle is held, draw it at the
                // dragged size instead of the stored one.
                const live = liveSize?.id === bubble.id ? liveSize : null;
                const width = live ? live.widthPx : storedWidth;
                const height = live ? live.heightPx : storedHeight;

                return (
                  <Group
                    key={bubble.id}
                    id={`bubble-${bubble.id}`}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    draggable
                    dragBoundFunc={(pos) => {
                      // pos is in absolute stage coordinates; bubbles live inside
                      // the centring Group at (offsetX, offsetY).
                      // Assumes an unscaled Stage — revisit if zoom is added.
                      const maxX = offsetX + dimensions.imageWidth - width;
                      const maxY = offsetY + dimensions.imageHeight - height;

                      return {
                        x: Math.min(Math.max(pos.x, offsetX), maxX),
                        y: Math.min(Math.max(pos.y, offsetY), maxY),
                      };
                    }}
                    onClick={() => onSelectBubble(bubble.id)}
                    onTap={() => onSelectBubble(bubble.id)}
                    onDragEnd={(e) => {
                      const clamped = clampRect({
                        x: pixelToNormalized(e.target.x(), 0, image.width, dimensions.imageWidth),
                        y: pixelToNormalized(e.target.y(), 0, image.height, dimensions.imageHeight),
                        width: bubble.width ?? 0.2,
                        height: bubble.height ?? 0.1,
                      });

                      // Snap the node to the clamped position explicitly. If the
                      // clamped value equals the previous one, React sees no prop
                      // change and Konva would leave the node where it was
                      // dropped — visually outside the artwork.
                      e.target.x(normalizedToPixel(clamped.x, 0, image.width, dimensions.imageWidth));
                      e.target.y(normalizedToPixel(clamped.y, 0, image.height, dimensions.imageHeight));

                      onUpdateBubble(bubble.id, { x: clamped.x, y: clamped.y });
                    }}
                    onTransform={(e) => {
                      // Live resize. The transformer scales the node; turn that
                      // scale into a real size straight away (the pattern Konva
                      // documents for resizable text), so the box and the text
                      // are laid out at the new size rather than stretched.
                      const node = e.target;
                      const nextWidth = Math.max(1, node.width() * node.scaleX());
                      const nextHeight = Math.max(1, node.height() * node.scaleY());

                      node.scaleX(1);
                      node.scaleY(1);
                      node.width(nextWidth);
                      node.height(nextHeight);

                      // Resize the box imperatively too, so the transformer's
                      // frame never lags a frame behind the React re-render.
                      const box = (node as Konva.Group).findOne<Konva.Rect>(".bubble-box");
                      box?.width(nextWidth);
                      box?.height(nextHeight);

                      scheduleLiveSize({ id: bubble.id, widthPx: nextWidth, heightPx: nextHeight });
                    }}
                    onTransformEnd={(e) => {
                      // Scale is already folded into width/height by onTransform;
                      // the multiply below is kept so this stays correct even if a
                      // transform ever ends without a transform event.
                      const node = e.target;
                      const scaleX = node.scaleX();
                      const scaleY = node.scaleY();

                      node.scaleX(1);
                      node.scaleY(1);

                      const clamped = clampRect({
                        x: pixelToNormalized(node.x(), 0, image.width, dimensions.imageWidth),
                        y: pixelToNormalized(node.y(), 0, image.height, dimensions.imageHeight),
                        width: pixelToNormalized(node.width() * scaleX, 0, image.width, dimensions.imageWidth),
                        height: pixelToNormalized(node.height() * scaleY, 0, image.height, dimensions.imageHeight),
                      });

                      node.x(normalizedToPixel(clamped.x, 0, image.width, dimensions.imageWidth));
                      node.y(normalizedToPixel(clamped.y, 0, image.height, dimensions.imageHeight));

                      onUpdateBubble(bubble.id, {
                        x: clamped.x,
                        y: clamped.y,
                        width: clamped.width,
                        height: clamped.height,
                      });
                      clearLiveSize();
                    }}
                  >
                    <BubbleContent
                      bubble={bubble}
                      isSelected={selectedBubbleId === bubble.id}
                      displayWidth={width}
                      displayHeight={height}
                      // Normalized size fed to the layout: the live size while
                      // resizing, otherwise the stored one.
                      normalizedWidth={live ? width / dimensions.imageWidth : bubble.width || 0.2}
                      normalizedHeight={live ? height / dimensions.imageHeight : bubble.height || 0.1}
                      displayScale={layoutArtworkWidth > 0 ? dimensions.imageWidth / layoutArtworkWidth : 1}
                      artworkWidth={layoutArtworkWidth}
                      artworkHeight={layoutArtworkHeight}
                      fontState={bubble.fontId ? fontStates.get(bubble.fontId) : undefined}
                      previewName={previewName}
                    />
                  </Group>
                );
              })}
            </Group>

            <Transformer
              ref={trRef}
              // No backend field for rotation — see note in app/types/comic.ts
              rotateEnabled={false}
              boundBoxFunc={(oldBox, newBox) => {
                // Minimum size
                if (newBox.width < 20 || newBox.height < 20) {
                  return oldBox;
                }
                // Reject any resize that would push the box outside the artwork.
                // Boxes are in the same absolute space as offsetX/offsetY.
                if (
                  newBox.x < offsetX ||
                  newBox.y < offsetY ||
                  newBox.x + newBox.width > offsetX + dimensions.imageWidth ||
                  newBox.y + newBox.height > offsetY + dimensions.imageHeight
                ) {
                  return oldBox;
                }
                return newBox;
              }}
              borderStroke="#914A8C"
              anchorStroke="#914A8C"
              anchorFill="#fff"
              anchorSize={8}
            />
          </Layer>
        </Stage>
      )}
    </div>
  );
}

// ============================================================
// BUBBLE CONTENT — box + text exactly as it prints
// ============================================================

interface BubbleContentProps {
  bubble: LocalBubble;
  isSelected: boolean;
  displayWidth: number;
  displayHeight: number;
  normalizedWidth: number;
  normalizedHeight: number;
  /** Screen px per artwork px. */
  displayScale: number;
  artworkWidth: number;
  artworkHeight: number;
  /** undefined when the bubble has no font assigned. */
  fontState: FontFileState | undefined;
  previewName: string;
}

/** Plain-language state of one bubble, derived from its font and layout. */
type ContentState =
  | { kind: "placeholder" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "drawn"; layout: Extract<BubbleLayout, { status: "ok" }> };

function BubbleContent({
  bubble,
  isSelected,
  displayWidth,
  displayHeight,
  normalizedWidth,
  normalizedHeight,
  displayScale,
  artworkWidth,
  artworkHeight,
  fontState,
  previewName,
}: BubbleContentProps) {
  const dialogue = bubble.dialogue ?? "";

  // Primitives and the parsed font only — the FontFileState wrapper object is
  // rebuilt on every render, so depending on it would re-run the layout (the
  // expensive shrink-to-fit loop) for every bubble on every render. The parsed
  // font itself is the query's cached value and keeps its identity.
  const fontStatus = fontState?.status;
  const fontErrorMessage = fontState?.status === "error" ? fontState.message : null;
  const loadedFont = fontState?.status === "ready" ? fontState.loaded : null;

  // Recomputed only when something that changes the text layout changes.
  // Moving a bubble never lands here: position is not an input.
  const state = useMemo<ContentState>(() => {
    if (!dialogue.trim()) return { kind: "placeholder" };
    if (fontStatus === "loading") return { kind: "loading" };
    if (fontErrorMessage !== null) return { kind: "error", message: fontErrorMessage };
    if (artworkWidth <= 0 || artworkHeight <= 0) return { kind: "loading" };

    const layout = layoutBubble({
      dialogue,
      childName: previewName,
      pronounKey: "HE",
      width: normalizedWidth,
      height: normalizedHeight,
      fontSize: bubble.fontSize ?? DEFAULT_FONT_SIZE,
      fontColor: bubble.fontColor ?? DEFAULT_FONT_COLOR,
      nameColor: bubble.nameColor ?? null,
      textAlign: bubble.textAlign ?? DEFAULT_TEXT_ALIGN,
      textVerticalAlign: bubble.textVerticalAlign ?? DEFAULT_TEXT_VERTICAL_ALIGN,
      textCase: bubble.textCase ?? DEFAULT_TEXT_CASE,
      artworkWidth,
      artworkHeight,
      // null = no font assigned; layoutBubble reports that with the backend's message.
      font: loadedFont,
    });

    if (layout.status === "empty") return { kind: "placeholder" };
    if (layout.status === "error") return { kind: "error", message: layout.message };
    return { kind: "drawn", layout };
  }, [
    dialogue,
    previewName,
    normalizedWidth,
    normalizedHeight,
    bubble.fontSize,
    bubble.fontColor,
    bubble.nameColor,
    bubble.textAlign,
    bubble.textVerticalAlign,
    bubble.textCase,
    artworkWidth,
    artworkHeight,
    fontStatus,
    fontErrorMessage,
    loadedFont,
  ]);

  const hasProblem =
    state.kind === "error" || (state.kind === "drawn" && !state.layout.fitted);

  return (
    <>
      <Rect
        name="bubble-box"
        width={displayWidth}
        height={displayHeight}
        fill={isSelected ? "rgba(145, 74, 140, 0.2)" : "rgba(255, 255, 255, 0.4)"}
        stroke={hasProblem ? PROBLEM_STROKE : isSelected ? SELECTED_STROKE : IDLE_STROKE}
        strokeWidth={2}
        cornerRadius={8}
      />

      {state.kind === "drawn" && (
        <GlyphText layout={state.layout} displayScale={displayScale} />
      )}

      {state.kind === "drawn" && !state.layout.fitted && (
        // Above the box, so it never covers the text it is warning about.
        <Text
          text="Text doesn't fit"
          y={-16}
          fontSize={11}
          fontStyle="bold"
          fill={PROBLEM_STROKE}
          listening={false}
        />
      )}

      {state.kind === "placeholder" && (
        <Text
          text="Double click to edit..."
          x={6}
          y={6}
          width={Math.max(0, displayWidth - 12)}
          fontSize={12}
          fill="#777"
          listening={false}
        />
      )}

      {state.kind === "loading" && (
        <Text
          text="Loading font…"
          width={displayWidth}
          height={displayHeight}
          align="center"
          verticalAlign="middle"
          fontSize={12}
          fontStyle="italic"
          fill="#888"
          listening={false}
        />
      )}

      {state.kind === "error" && (
        <Text
          text={state.message}
          x={6}
          y={6}
          width={Math.max(0, displayWidth - 12)}
          height={Math.max(0, displayHeight - 12)}
          fontSize={11}
          fill={PROBLEM_STROKE}
          wrap="word"
          ellipsis
          listening={false}
        />
      )}
    </>
  );
}

/** Replays opentype path commands onto a 2D canvas context. */
function tracePath(ctx: CanvasRenderingContext2D, commands: PathCommand[]) {
  ctx.beginPath();
  for (const command of commands) {
    switch (command.type) {
      case "M":
        ctx.moveTo(command.x, command.y);
        break;
      case "L":
        ctx.lineTo(command.x, command.y);
        break;
      case "C":
        ctx.bezierCurveTo(command.x1, command.y1, command.x2, command.y2, command.x, command.y);
        break;
      case "Q":
        ctx.quadraticCurveTo(command.x1, command.y1, command.x, command.y);
        break;
      case "Z":
        ctx.closePath();
        break;
    }
  }
}

/**
 * Draws the bubble's glyph outlines — the same geometry the print renderer
 * stamps — in one fill per colour. Layout is in artwork px, so it is scaled to
 * the on-screen size here. Click-through: selection is handled by the box.
 */
function GlyphText({
  layout,
  displayScale,
}: {
  layout: Extract<BubbleLayout, { status: "ok" }>;
  displayScale: number;
}) {
  return (
    <Shape
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={(context) => {
        const ctx = (context as unknown as { _context: CanvasRenderingContext2D })._context;

        ctx.save();
        ctx.scale(displayScale, displayScale);

        if (layout.textCommands.length > 0) {
          tracePath(ctx, layout.textCommands);
          ctx.fillStyle = layout.fill;
          ctx.fill();
        }

        if (layout.nameFill && layout.nameCommands.length > 0) {
          tracePath(ctx, layout.nameCommands);
          ctx.fillStyle = layout.nameFill;
          ctx.fill();
        }

        ctx.restore();
      }}
    />
  );
}
