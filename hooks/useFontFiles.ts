import { useQueries } from "@tanstack/react-query";
import { fetchFontFile } from "@/app/actions/font";
import { loadFont, type LoadedFont } from "@/lib/bubbleLayout";
import type { Font } from "@/app/types/comic";

/** One font's load state, keyed by font id in the map returned below. */
export type FontFileState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; loaded: LoadedFont };

/** Shared with useUpdateFont / useDeleteFont so they can drop a stale file. */
export const fontFileQueryKey = (fontId: string) => ["font-file", fontId] as const;

/**
 * Downloads and parses every font a page's bubbles use, so the bubble-mapper
 * canvas can draw text with the real glyphs.
 *
 * One query per font. Cached for the whole session and never refetched on its
 * own — a font file does not change unless an admin replaces it, and the font
 * hooks invalidate this key when that happens. A page reload revalidates
 * through the browser HTTP cache (ETag → 304), so it is cheap.
 *
 * `structuralSharing: false` because the cached value is a parsed opentype.js
 * Font — a large class instance TanStack's JSON-style comparison is not meant
 * to walk.
 */
export function useFontFiles(fonts: Font[], fontIds: string[]): Map<string, FontFileState> {
  const uniqueIds = [...new Set(fontIds)];
  const fontsById = new Map(fonts.map((font) => [font.id, font]));

  const results = useQueries({
    queries: uniqueIds.map((fontId) => {
      const font = fontsById.get(fontId);
      return {
        queryKey: fontFileQueryKey(fontId),
        queryFn: async () => {
          const buffer = await fetchFontFile(fontId);
          // loadFont throws with the backend's own parse/WOFF2 messages.
          return loadFont(buffer, font?.name ?? "Unknown font", font?.fileUrl ?? "");
        },
        enabled: Boolean(font),
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 1,
        structuralSharing: false,
        refetchOnWindowFocus: false,
      };
    }),
  });

  const states = new Map<string, FontFileState>();

  uniqueIds.forEach((fontId, index) => {
    const result = results[index]!;

    // The query is disabled for an id missing from the comic's font list, so it
    // would otherwise sit at "loading" forever.
    if (!fontsById.has(fontId)) {
      states.set(fontId, {
        status: "error",
        message: "This bubble's font is not in this comic's font list. Pick a font again.",
      });
    } else if (result.data) {
      states.set(fontId, { status: "ready", loaded: result.data });
    } else if (result.error) {
      states.set(fontId, {
        status: "error",
        message: result.error instanceof Error ? result.error.message : String(result.error),
      });
    } else {
      states.set(fontId, { status: "loading" });
    }
  });

  return states;
}
