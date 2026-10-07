// Utilities to convert between normalized API coordinates (0-1) and Konva canvas coordinates (pixels)

import type { TextAlign, TextVerticalAlign, TextCase } from "@/app/types/comic";

/**
 * Converts normalized API values (0.0 to 1.0) to actual canvas pixels
 */
export function normalizedToPixel(
  value: number,
  canvasSize: number,
  imageOriginalSize: number,
  imageRenderedSize: number
): number {
  // First, find what pixel this is on the ORIGINAL image
  const originalPixel = value * imageOriginalSize;
  
  // Then scale that to however the image is currently rendered on canvas
  const scale = imageRenderedSize / imageOriginalSize;
  
  return originalPixel * scale;
}

/**
 * Converts actual canvas pixels to normalized API values (0.0 to 1.0)
 */
export function pixelToNormalized(
  pixelValue: number,
  canvasSize: number,
  imageOriginalSize: number,
  imageRenderedSize: number
): number {
  // Find what the original pixel would be
  const scale = imageRenderedSize / imageOriginalSize;
  const originalPixel = pixelValue / scale;
  
  // Convert to 0-1 fraction
  return originalPixel / imageOriginalSize;
}

export function toFixed(value: number, precision: number = 4): number {
  return parseFloat(value.toFixed(precision));
}

// Bubble.fontSize is a fraction of the artwork's HEIGHT, never a pixel value.
// These bounds mirror MIN/MAX/DEFAULT_FONT_SIZE in the backend's
// src/config/generation.ts — sending anything outside them returns a 400.
export const MIN_FONT_SIZE = 0.005;
export const MAX_FONT_SIZE = 0.25;
export const DEFAULT_FONT_SIZE = 0.02;

/** Fraction → pixels on a surface of the given height. */
export function fontSizeToPx(fraction: number, surfaceHeight: number): number {
  return fraction * surfaceHeight;
}

/** Pixels → fraction, clamped to the backend's accepted range. */
export function pxToFontSize(px: number, artworkHeight: number): number {
  const raw = px / artworkHeight;
  return Math.min(Math.max(raw, MIN_FONT_SIZE), MAX_FONT_SIZE);
}

// ── Bubble text colour ────────────────────────────────────────────────────────
// Mirrors DEFAULT_FONT_COLOR / FONT_COLOR_PATTERN in the backend's
// src/config/generation.ts. Exactly one form is accepted end to end: "#rrggbb".
// No 3-digit shorthand, no 8-digit alpha, no CSS colour names — anything else is
// a 400. The native <input type="color"> emits precisely this form, so the
// picker and the API agree without conversion.
export const DEFAULT_FONT_COLOR = "#000000";
export const FONT_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** True when `value` is a colour the backend will accept. */
export function isValidFontColor(value: string): boolean {
  return FONT_COLOR_PATTERN.test(value.trim());
}

/** Normalise to the single canonical form the API stores. */
export function normalizeFontColor(value: string): string {
  return value.trim().toLowerCase();
}

// ── Bubble text placement and casing ──────────────────────────────────────────
// Mirrors DEFAULT_TEXT_ALIGN / DEFAULT_TEXT_VERTICAL_ALIGN / DEFAULT_TEXT_CASE
// in the backend's src/config/generation.ts. The defaults are what the renderer
// did unconditionally before these fields existed, so an untouched bubble looks
// exactly as it always has.
export const DEFAULT_TEXT_ALIGN: TextAlign = "CENTER";
export const DEFAULT_TEXT_VERTICAL_ALIGN: TextVerticalAlign = "MIDDLE";
export const DEFAULT_TEXT_CASE: TextCase = "AS_TYPED";

// Option lists drive the sidebar's segmented controls. Kept here rather than
// inline in JSX so the labels have one home and the values cannot drift from
// the Prisma enums.
export const TEXT_ALIGN_OPTIONS: { value: TextAlign; label: string }[] = [
  { value: "LEFT", label: "Left" },
  { value: "CENTER", label: "Center" },
  { value: "RIGHT", label: "Right" },
];

export const TEXT_VERTICAL_ALIGN_OPTIONS: {
  value: TextVerticalAlign;
  label: string;
}[] = [
  { value: "TOP", label: "Top" },
  { value: "MIDDLE", label: "Middle" },
  { value: "BOTTOM", label: "Bottom" },
];

export const TEXT_CASE_OPTIONS: { value: TextCase; label: string }[] = [
  { value: "AS_TYPED", label: "As typed" },
  { value: "UPPERCASE", label: "AA" },
  { value: "LOWERCASE", label: "aa" },
];

/**
 * Apply a bubble's casing for preview purposes.
 *
 * Must stay in step with applyTextCase() in the backend's textStamp.ts — this
 * is what makes the sidebar preview and the canvas agree with the printed page.
 */
export function applyTextCase(text: string, textCase: TextCase): string {
  if (textCase === "UPPERCASE") return text.toUpperCase();
  if (textCase === "LOWERCASE") return text.toLowerCase();
  return text;
}

/** Konva's Text takes lowercase align values; the API stores uppercase enums. */
export function toKonvaAlign(align: TextAlign): "left" | "center" | "right" {
  return align.toLowerCase() as "left" | "center" | "right";
}

export function toKonvaVerticalAlign(
  verticalAlign: TextVerticalAlign,
): "top" | "middle" | "bottom" {
  return verticalAlign.toLowerCase() as "top" | "middle" | "bottom";
}

/**
 * WCAG relative luminance, 0 (black) to 1 (white).
 * Returns 1 for anything unparseable so a malformed value never trips the
 * low-contrast warning while the admin is mid-typing.
 */
export function relativeLuminance(hex: string): number {
  if (!isValidFontColor(hex)) return 1;

  const channels = [1, 3, 5].map((offset) => {
    const srgb = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    // sRGB → linear, per the WCAG 2.x definition.
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  }) as [number, number, number];

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

// Above this luminance, text is too pale to read against the light speech
// bubbles the artwork uses (~2:1 contrast on white, well under the WCAG 4.5:1
// floor for body text). Deliberately a named constant: it is a judgement call
// about this specific artwork style and should be retuned once real comics have
// been coloured, not treated as a law.
export const LOW_CONTRAST_LUMINANCE = 0.6;

/**
 * Advisory only — the admin panel warns, it never blocks the save, and the API
 * accepts any valid hex. The server cannot see the artwork behind a bubble, so
 * a hard rule would be guesswork; the person looking at the page decides.
 */
export function isLowContrast(hex: string): boolean {
  return isValidFontColor(hex) && relativeLuminance(hex) > LOW_CONTRAST_LUMINANCE;
}

// Smallest bubble we allow, as a fraction. Matches the Math.max(0.01, …) the
// canvas used before clamping was centralised here.
export const MIN_BUBBLE_SIZE = 0.01;

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Constrains a normalized rectangle so it sits entirely inside the artwork,
 * mirroring the backend's rules (bubble.service + createBubbleSchema):
 *   0 <= x, 0 <= y, x + width <= 1, y + height <= 1
 *
 * Size is clamped and rounded FIRST, then the position limit is derived from
 * the rounded size — so `x + width` can never round its way past 1 and trip the
 * server's bounds check.
 */
export function clampRect(rect: NormalizedRect): NormalizedRect {
  const width = toFixed(Math.min(Math.max(rect.width, MIN_BUBBLE_SIZE), 1));
  const height = toFixed(Math.min(Math.max(rect.height, MIN_BUBBLE_SIZE), 1));

  return {
    width,
    height,
    x: toFixed(Math.min(Math.max(rect.x, 0), 1 - width)),
    y: toFixed(Math.min(Math.max(rect.y, 0), 1 - height)),
  };
}
