// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ THIS FILE IS A COPY OF THE BACKEND'S PRINT RENDERER LAYOUT.
//
//    backend/src/jobs/workers/sd/textStamp.ts
//
// The bubble-mapper canvas draws text with this so the admin sees EXACTLY what
// prints: same font, same line breaks, same auto-shrink, same alignment, same
// name colour. That only holds while the two files agree. If you change how the
// backend measures, wraps, fits, aligns, cases or colours text — change it here
// too, in the same way, or the canvas silently starts lying to the admin.
//
// Constants mirrored here: LINE_HEIGHT_FACTOR, MIN_FONT_SIZE (via
// bubbleCoordinates), SHAPING_PROBE_TEXT, the token/pronoun table (via
// dialogueTokens), and every error message.
//
// Output is in ARTWORK pixels, relative to the bubble box's top-left corner —
// the same coordinate space as the backend's per-bubble SVG. The canvas scales
// it to screen size when drawing.
// ─────────────────────────────────────────────────────────────────────────────

import { parse, type Font, type Glyph, type PathCommand } from "opentype.js";
import type { TextAlign, TextCase, TextVerticalAlign } from "@/app/types/comic";
import {
  substituteTokensToSegments,
  type DialogueSegment,
} from "@/lib/dialogueTokens";
import {
  FONT_COLOR_PATTERN,
  MIN_FONT_SIZE,
} from "@/components/admin/comic/bubbles/bubbleCoordinates";

/** Mirrors LINE_HEIGHT_FACTOR in textStamp.ts. */
const LINE_HEIGHT_FACTOR = 1.15;

/** Mirrors SHAPING_PROBE_TEXT in textStamp.ts. */
const SHAPING_PROBE_TEXT = "AVa fi 1.";
const SHAPING_PROBE_SIZE_PX = 100;

// ============================================================
// FONT LOADING
// ============================================================

/**
 * A parsed font plus whether opentype.js's shaper can handle it. Decided once
 * at load time — see LoadedFont in textStamp.ts for why measure and draw must
 * both read the same flag.
 */
export type LoadedFont = {
  font: Font;
  name: string;
  canShape: boolean;
};

/**
 * Parse a downloaded font file. Throws with the backend's own messages
 * (parseFont in textStamp.ts), so the admin reads the same explanation on the
 * canvas as the real generation would produce.
 */
export function loadFont(
  buffer: ArrayBuffer,
  fontName: string,
  fontKey: string,
): LoadedFont {
  let font: Font;

  try {
    font = parse(buffer);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);

    if (fontKey.endsWith(".woff2") || detail.includes("WOFF2")) {
      throw new Error(
        `Font "${fontName}" (${fontKey}) is WOFF2, which cannot be used for page rendering. ` +
          `Re-upload this font as .ttf or .otf.`,
      );
    }

    throw new Error(
      `Font "${fontName}" (${fontKey}) could not be parsed and cannot be used for page rendering. ` +
        `Re-upload a valid .ttf or .otf file. Parser said: ${detail}`,
    );
  }

  let canShape = true;
  try {
    font.getAdvanceWidth(SHAPING_PROBE_TEXT, SHAPING_PROBE_SIZE_PX);
  } catch {
    canShape = false;
  }

  return { font, name: fontName, canShape };
}

// ============================================================
// MEASURING & DRAWING (mirrors textStamp.ts)
// ============================================================

/** Mirrors layoutUnshaped in textStamp.ts — per-glyph layout without the shaper. */
function layoutUnshaped(
  font: Font,
  text: string,
  fontSizePx: number,
  onGlyph?: (glyph: Glyph, penXPx: number) => void,
): number {
  const scale = fontSizePx / font.unitsPerEm;
  const glyphs = [...text].map((char) => font.charToGlyph(char));

  let penXPx = 0;

  for (let index = 0; index < glyphs.length; index += 1) {
    const glyph = glyphs[index]!;

    onGlyph?.(glyph, penXPx);

    if (glyph.advanceWidth) penXPx += glyph.advanceWidth * scale;

    const next = glyphs[index + 1];
    if (next) penXPx += font.getKerningValue(glyph, next) * scale;
  }

  return penXPx;
}

/** Mirrors assertGlyphCoverage — returns the message instead of throwing. */
function findMissingGlyphs(loaded: LoadedFont, text: string): string | null {
  const missing = new Set<string>();

  for (const char of text) {
    if (/\s/.test(char)) continue;
    if (loaded.font.charToGlyphIndex(char) === 0) missing.add(char);
  }

  if (missing.size === 0) return null;

  return (
    `Font "${loaded.name}" has no glyphs for: ${[...missing].join(" ")}. ` +
    `The dialogue (or the child's name) uses characters this font does not contain — ` +
    `they would render as blank or as empty boxes. Use a font that covers this text.`
  );
}

/** Mirrors applyTextCase in textStamp.ts. */
function applyTextCase(text: string, textCase: TextCase): string {
  switch (textCase) {
    case "UPPERCASE":
      return text.toUpperCase();
    case "LOWERCASE":
      return text.toLowerCase();
    case "AS_TYPED":
    default:
      return text;
  }
}

function measureWidth(loaded: LoadedFont, text: string, fontSizePx: number): number {
  return loaded.canShape
    ? loaded.font.getAdvanceWidth(text, fontSizePx)
    : layoutUnshaped(loaded.font, text, fontSizePx);
}

/**
 * Glyph outline commands for one run of text with its left edge at `xPx` and
 * baseline at `baselineYPx`. Mirrors buildLinePathData, but returns the raw
 * commands — the canvas draws them directly, so there is no SVG serialising
 * step (and so none of the NaN-rounding hazard that step had in the backend).
 */
function buildLineCommands(
  loaded: LoadedFont,
  line: string,
  xPx: number,
  baselineYPx: number,
  fontSizePx: number,
): PathCommand[] {
  if (loaded.canShape) {
    return loaded.font.getPath(line, xPx, baselineYPx, fontSizePx).commands;
  }

  const commands: PathCommand[] = [];

  layoutUnshaped(loaded.font, line, fontSizePx, (glyph, penXPx) => {
    commands.push(
      ...glyph.getPath(xPx + penXPx, baselineYPx, fontSizePx, undefined, loaded.font)
        .commands,
    );
  });

  return commands;
}

type LineMetrics = {
  lineHeightPx: number;
  ascenderPx: number;
  leadingPx: number;
};

function lineMetrics(font: Font, fontSizePx: number): LineMetrics {
  const scale = fontSizePx / font.unitsPerEm;
  const ascenderPx = font.ascender * scale;
  const naturalLineHeightPx = ascenderPx - font.descender * scale;
  const lineHeightPx = naturalLineHeightPx * LINE_HEIGHT_FACTOR;

  return {
    lineHeightPx,
    ascenderPx,
    leadingPx: lineHeightPx - naturalLineHeightPx,
  };
}

// ============================================================
// NAME-COLOUR TRACKING (mirrors textStamp.ts)
// ============================================================

type StyledText = {
  text: string;
  nameMask: boolean[];
};

/** Mirrors buildStyledText — casing per segment, then trim both arrays alike. */
function buildStyledText(
  segments: DialogueSegment[],
  textCase: TextCase,
): StyledText {
  let text = "";
  const nameMask: boolean[] = [];

  for (const segment of segments) {
    const cased = applyTextCase(segment.text, textCase);
    text += cased;
    for (let index = 0; index < cased.length; index += 1) {
      nameMask.push(segment.isName);
    }
  }

  const start = text.length - text.trimStart().length;
  const end = text.trimEnd().length;

  if (end <= start) return { text: "", nameMask: [] };

  return {
    text: text.slice(start, end),
    nameMask: nameMask.slice(start, end),
  };
}

type ColourRun = {
  text: string;
  start: number;
  isName: boolean;
};

/** Mirrors splitIntoColourRuns. */
function splitIntoColourRuns(line: StyledText): ColourRun[] {
  const runs: ColourRun[] = [];
  let start = 0;

  for (let index = 1; index <= line.text.length; index += 1) {
    const atEnd = index === line.text.length;

    if (atEnd || line.nameMask[index] !== line.nameMask[start]) {
      runs.push({
        text: line.text.slice(start, index),
        start,
        isName: line.nameMask[start] === true,
      });
      start = index;
    }
  }

  return runs;
}

// ============================================================
// WRAP & FIT (mirrors textStamp.ts)
// ============================================================

/** Mirrors wrapText. */
function wrapText(
  loaded: LoadedFont,
  styled: StyledText,
  maxWidthPx: number,
  fontSizePx: number,
): StyledText[] {
  const words: StyledText[] = [];
  for (const match of styled.text.matchAll(/\S+/g)) {
    const start = match.index;
    words.push({
      text: match[0],
      nameMask: styled.nameMask.slice(start, start + match[0].length),
    });
  }

  if (words.length === 0) return [];

  const lines: StyledText[] = [];
  let current: StyledText | null = null;

  for (const word of words) {
    const candidate: StyledText = current
      ? {
          text: `${current.text} ${word.text}`,
          nameMask: [...current.nameMask, false, ...word.nameMask],
        }
      : word;

    if (measureWidth(loaded, candidate.text, fontSizePx) <= maxWidthPx) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);

  return lines;
}

type FittedText = {
  fontSizePx: number;
  lines: StyledText[];
  fitted: boolean;
};

/** Mirrors fitTextToBox — largest size, down in 1px steps, never below the floor. */
function fitTextToBox(
  loaded: LoadedFont,
  styled: StyledText,
  boxWidthPx: number,
  boxHeightPx: number,
  initialFontSizePx: number,
  artworkHeight: number,
): FittedText {
  const minFontSizePx = Math.max(1, MIN_FONT_SIZE * artworkHeight);

  const fits = (fontSizePx: number): StyledText[] | null => {
    const lines = wrapText(loaded, styled, boxWidthPx, fontSizePx);
    if (lines.length === 0) return null;

    const widestLinePx = Math.max(
      ...lines.map((line) => measureWidth(loaded, line.text, fontSizePx)),
    );
    const totalHeightPx =
      lines.length * lineMetrics(loaded.font, fontSizePx).lineHeightPx;

    return widestLinePx <= boxWidthPx && totalHeightPx <= boxHeightPx ? lines : null;
  };

  for (
    let fontSizePx = Math.floor(initialFontSizePx);
    fontSizePx >= minFontSizePx;
    fontSizePx -= 1
  ) {
    const lines = fits(fontSizePx);
    if (lines) return { fontSizePx, lines, fitted: true };
  }

  return {
    fontSizePx: minFontSizePx,
    lines: wrapText(loaded, styled, boxWidthPx, minFontSizePx),
    fitted: false,
  };
}

// ============================================================
// ENTRY POINT
// ============================================================

export type BubbleLayoutInput = {
  dialogue: string;
  childName: string;
  pronounKey: "HE" | "SHE" | "THEY";
  /** Normalized 0–1, as stored. Only size matters here — position never changes layout. */
  width: number;
  height: number;
  /** Fraction of artwork height, as stored. */
  fontSize: number;
  fontColor: string;
  nameColor: string | null;
  textAlign: TextAlign;
  textVerticalAlign: TextVerticalAlign;
  textCase: TextCase;
  /** From the DB (Sharp-probed), exactly what the backend uses. */
  artworkWidth: number;
  artworkHeight: number;
  /** null when the bubble has no font assigned. */
  font: LoadedFont | null;
};

export type BubbleLayout =
  /** Nothing to draw — the backend skips these bubbles too. */
  | { status: "empty" }
  /** The backend would fail the page with this same message. */
  | { status: "error"; message: string }
  | {
      status: "ok";
      /** Glyph outlines in artwork px, relative to the box's top-left. */
      textCommands: PathCommand[];
      nameCommands: PathCommand[];
      fill: string;
      /** null = the name is drawn in `fill` (single colour). */
      nameFill: string | null;
      fontSizePx: number;
      /** False = text overflows even at the minimum size, like the backend's warn. */
      fitted: boolean;
      lines: string[];
      boxWidthPx: number;
      boxHeightPx: number;
    };

/** Mirrors resolveNameFill — null when unset or the same colour as the text. */
function resolveNameFill(fontColor: string, nameColor: string | null): string | null {
  const name = nameColor?.toLowerCase() ?? null;
  if (!name || name === fontColor.toLowerCase()) return null;
  return FONT_COLOR_PATTERN.test(name) ? name : null;
}

function allFinite(commands: PathCommand[]): boolean {
  return commands.every((command) =>
    Object.entries(command).every(
      ([key, value]) => key === "type" || Number.isFinite(value as number),
    ),
  );
}

/**
 * Lay out one bubble exactly as stampTextOnPage would, in the same order of
 * checks: empty text is skipped before the font is even required, then a
 * missing font, then glyph coverage, then fit and draw.
 */
export function layoutBubble(input: BubbleLayoutInput): BubbleLayout {
  const styled = buildStyledText(
    substituteTokensToSegments(input.dialogue, input.childName, input.pronounKey),
    input.textCase,
  );

  if (styled.text.length === 0) return { status: "empty" };

  if (!input.font) {
    return {
      status: "error",
      message:
        "This bubble has dialogue but no font assigned. " +
        "Assign a font to this bubble — there is no fallback font.",
    };
  }

  const loaded = input.font;

  const missing = findMissingGlyphs(loaded, styled.text);
  if (missing) return { status: "error", message: missing };

  // Same rounding as the backend: the box IS the backend's SVG canvas.
  const boxWidthPx = Math.round(input.width * input.artworkWidth);
  const boxHeightPx = Math.round(input.height * input.artworkHeight);
  const initialFontSizePx = input.fontSize * input.artworkHeight;

  const { fontSizePx, lines, fitted } = fitTextToBox(
    loaded,
    styled,
    boxWidthPx,
    boxHeightPx,
    initialFontSizePx,
    input.artworkHeight,
  );

  if (lines.length === 0) return { status: "empty" };

  const nameFill = resolveNameFill(input.fontColor, input.nameColor);

  // --- Mirrors buildBubbleSvg ---
  const { lineHeightPx, ascenderPx, leadingPx } = lineMetrics(loaded.font, fontSizePx);

  const blockHeightPx = lines.length * lineHeightPx;
  const blockTopPx =
    input.textVerticalAlign === "TOP"
      ? 0
      : input.textVerticalAlign === "BOTTOM"
        ? boxHeightPx - blockHeightPx
        : (boxHeightPx - blockHeightPx) / 2;
  const firstBaselineY = blockTopPx + leadingPx / 2 + ascenderPx;

  const textCommands: PathCommand[] = [];
  const nameCommands: PathCommand[] = [];

  lines.forEach((line, index) => {
    const lineWidthPx = measureWidth(loaded, line.text, fontSizePx);
    const x =
      input.textAlign === "LEFT"
        ? 0
        : input.textAlign === "RIGHT"
          ? boxWidthPx - lineWidthPx
          : (boxWidthPx - lineWidthPx) / 2;
    const baselineY = firstBaselineY + index * lineHeightPx;

    if (!nameFill) {
      textCommands.push(...buildLineCommands(loaded, line.text, x, baselineY, fontSizePx));
      return;
    }

    for (const run of splitIntoColourRuns(line)) {
      if (run.text.trim().length === 0) continue;

      const offsetPx =
        run.start === 0 ? 0 : measureWidth(loaded, line.text.slice(0, run.start), fontSizePx);

      (run.isName ? nameCommands : textCommands).push(
        ...buildLineCommands(loaded, run.text, x + offsetPx, baselineY, fontSizePx),
      );
    }
  });

  // Mirrors the backend's formatCoord / assertSafePathData guard.
  if (!allFinite(textCommands) || !allFinite(nameCommands)) {
    return {
      status: "error",
      message:
        "Text rendering produced an invalid coordinate — this bubble cannot be drawn safely.",
    };
  }

  return {
    status: "ok",
    textCommands,
    nameCommands,
    fill: input.fontColor,
    nameFill,
    fontSizePx,
    fitted,
    lines: lines.map((line) => line.text),
    boxWidthPx,
    boxHeightPx,
  };
}
