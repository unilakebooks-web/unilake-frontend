"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useComic } from "@/hooks/useComics";
import { useFonts } from "@/hooks/useFonts";
import {
  fetchBubbles,
  createBubble,
  updateBubble,
  deleteBubble,
} from "@/app/actions/bubble";

import { BubbleMapperHeader } from "@/components/admin/comic/bubbles/BubbleMapperHeader";
import {
  BubbleSidebar,
  LocalBubble,
} from "@/components/admin/comic/bubbles/BubbleSidebar";
import { BubbleMapperCanvas } from "@/components/admin/comic/bubbles/BubbleMapperCanvas";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_COLOR,
  DEFAULT_TEXT_ALIGN,
  DEFAULT_TEXT_VERTICAL_ALIGN,
  DEFAULT_TEXT_CASE,
} from "@/components/admin/comic/bubbles/bubbleCoordinates";
import type {
  TextAlign,
  TextVerticalAlign,
  TextCase,
  PreviewStampBubble,
} from "@/app/types/comic";
import { BubblePreviewModal } from "@/components/admin/comic/bubbles/BubblePreviewModal";
import { SAMPLE_NAMES } from "@/lib/dialogueTokens";
import { useFontFiles } from "@/hooks/useFontFiles";

export default function BubbleMapperPage({
  params,
}: {
  params: Promise<{ comicId: string; pageId: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const resolvedParams = use(params);
  const comicId = resolvedParams.comicId;
  const pageId = resolvedParams.pageId;

  const { data: comic, isLoading: isComicLoading } = useComic(comicId);
  const { data: fonts, isLoading: isFontsLoading } = useFonts(comicId);

  const [bubbles, setBubbles] = useState<LocalBubble[]>([]);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingBubbles, setIsLoadingBubbles] = useState(true);

  // New bubbles inherit the colour last chosen on this page, so colouring a
  // whole page one shade doesn't mean re-picking it every time. Resets to black
  // on a fresh page load — deliberately not persisted anywhere.
  const [lastUsedColor, setLastUsedColor] = useState<string>(DEFAULT_FONT_COLOR);
  // Same for the name colour. null ("Same as text") is a real choice and is
  // remembered too, so picking it once sticks for the next bubbles.
  const [lastUsedNameColor, setLastUsedNameColor] = useState<string | null>(null);

  // Placement and casing stick the same way and for the same reason: a page is
  // usually mapped with one treatment throughout, so re-picking it on every
  // bubble is pure friction. Also session-only, never persisted.
  const [lastUsedTextAlign, setLastUsedTextAlign] =
    useState<TextAlign>(DEFAULT_TEXT_ALIGN);
  const [lastUsedTextVerticalAlign, setLastUsedTextVerticalAlign] =
    useState<TextVerticalAlign>(DEFAULT_TEXT_VERTICAL_ALIGN);
  const [lastUsedTextCase, setLastUsedTextCase] =
    useState<TextCase>(DEFAULT_TEXT_CASE);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Which sample name previews use. Lives here rather than in the sidebar so the
  // canvas and the sidebar always agree. Defaults to the LONG name: sizing a
  // bubble against the worst case is what stops a real "Ramanujan" from being
  // shrunk to fit at generation time.
  const [previewLongName, setPreviewLongName] = useState(true);
  const previewName = previewLongName ? SAMPLE_NAMES.long : SAMPLE_NAMES.short;

  const page = comic?.pages.find((p) => p.id === pageId);

  // Parsed font files for every font a bubble on this page uses, so the canvas
  // can draw text exactly as the print renderer will.
  const fontStates = useFontFiles(
    fonts ?? [],
    bubbles
      .filter((bubble) => !bubble.isDeleted && bubble.fontId)
      .map((bubble) => bubble.fontId as string),
  );

  // Load initial bubbles
  useEffect(() => {
    async function loadBubbles() {
      try {
        const data = await fetchBubbles(pageId);
        setBubbles(
          data.map((b) => ({
            ...b,
            isNew: false,
            isModified: false,
            isDeleted: false,
          })),
        );
      } catch (err: any) {
        toast.error("Failed to load bubbles: " + err?.message);
      } finally {
        setIsLoadingBubbles(false);
      }
    }
    if (pageId) loadBubbles();
  }, [pageId]);

  const hasUnsavedChanges = bubbles.some(
    (b) => b.isNew || b.isModified || b.isDeleted,
  );

  const hasEmptyDialogue = bubbles.some(
    b => !b.isDeleted  && !b.dialogue?.trim()
    );

  const hasMissingFont = bubbles.some((b) => !b.isDeleted && !b.fontId);

  const hasBlockingIssue = hasEmptyDialogue || hasMissingFont;

  /**
   * Preview is only allowed on a clean, complete page.
   *
   * The button stays clickable while blocked so this can say WHY — a disabled
   * button would swallow the click and leave the admin guessing.
   *
   * Check order matters. A page can be both unsaved AND missing a font, and in
   * that case "save your changes first" is a dead end: Save is itself disabled
   * until the font is assigned. Naming the font problem first gives the admin
   * something they can actually act on.
   */
  const handlePreview = () => {
    if (hasMissingFont) {
      toast.error(
        "Cannot preview — some bubbles have no font assigned. Assign a font to every bubble first.",
      );
      return;
    }

    if (hasEmptyDialogue) {
      toast.error(
        "Cannot preview — some bubbles have no dialogue. Fill them in first.",
      );
      return;
    }

    if (hasUnsavedChanges) {
      toast.error(
        "Cannot preview this page due to unsaved changes. Save your changes first.",
      );
      return;
    }

    setIsPreviewOpen(true);
  };

  const handleAddBubble = () => {
    const newBubble: LocalBubble = {
      id: `new-${Date.now()}`,
      dialogue: "New Bubble",
      x: 0.1,
      y: 0.1,
      width: 0.3,
      height: 0.15,
      fontSize: DEFAULT_FONT_SIZE,
      fontColor: lastUsedColor,
      nameColor: lastUsedNameColor,
      textAlign: lastUsedTextAlign,
      textVerticalAlign: lastUsedTextVerticalAlign,
      textCase: lastUsedTextCase,
      sortOrder: bubbles.filter((b) => !b.isDeleted).length,
      fontId: fonts && fonts.length > 0 ? fonts[0].id : undefined,
      isNew: true,
      isModified: false,
      isDeleted: false,
    };
    setBubbles((prev) => [...prev, newBubble]);
    setSelectedBubbleId(newBubble.id);
  };

  // What the preview renders: the bubbles exactly as they stand on screen,
  // saved or not. Deleted ones are filtered out — a bubble removed but not yet
  // saved must not appear. The `?? DEFAULT_` fallbacks mirror the save payload
  // so preview and save always send the same values.
  const previewBubbles: PreviewStampBubble[] = bubbles
    .filter((bubble) => !bubble.isDeleted)
    .map((bubble) => ({
      id: bubble.id,
      x: bubble.x ?? 0,
      y: bubble.y ?? 0,
      width: bubble.width ?? 0.1,
      height: bubble.height ?? 0.1,
      dialogue: bubble.dialogue ?? "",
      fontId: bubble.fontId ?? null,
      fontSize: bubble.fontSize ?? DEFAULT_FONT_SIZE,
      fontColor: bubble.fontColor ?? DEFAULT_FONT_COLOR,
      nameColor: bubble.nameColor ?? null,
      textAlign: bubble.textAlign ?? DEFAULT_TEXT_ALIGN,
      textVerticalAlign: bubble.textVerticalAlign ?? DEFAULT_TEXT_VERTICAL_ALIGN,
      textCase: bubble.textCase ?? DEFAULT_TEXT_CASE,
    }));

  const handleUpdateBubble = (id: string, updates: Partial<LocalBubble>) => {
    // Remember the most recent choices so the next new bubble starts there.
    if (updates.fontColor) setLastUsedColor(updates.fontColor);
    // `in`, not truthiness: null ("Same as text") must be remembered as well.
    if ("nameColor" in updates) setLastUsedNameColor(updates.nameColor ?? null);
    if (updates.textAlign) setLastUsedTextAlign(updates.textAlign);
    if (updates.textVerticalAlign)
      setLastUsedTextVerticalAlign(updates.textVerticalAlign);
    if (updates.textCase) setLastUsedTextCase(updates.textCase);

    setBubbles((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          return { ...b, ...updates, isModified: !b.isNew };
        }
        return b;
      }),
    );
  };

  const handleDeleteBubble = (id: string) => {
    setBubbles((prev) =>
      prev
        .map((b) => {
          if (b.id === id) {
            if (b.isNew) {
              // If it's new, just remove it from array
              return { ...b, removeImmediate: true } as any;
            }
            return { ...b, isDeleted: true };
          }
          return b;
        })
        .filter((b) => !b.removeImmediate),
    );
    if (selectedBubbleId === id) setSelectedBubbleId(null);
  };

  const handleReset = async () => {
    setIsLoadingBubbles(true);
    setBubbles([]);
    setSelectedBubbleId(null);
    try {
      const data = await fetchBubbles(pageId);
      setBubbles(
        data.map((b) => ({
          ...b,
          isNew: false,
          isModified: false,
          isDeleted: false,
        })),
      );
    } catch (err: any) {
      toast.error("Failed to reset bubbles");
    } finally {
      setIsLoadingBubbles(false);
    }
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    // Sidebar numbers bubbles by their position among non-deleted ones —
    // match that here or the error points at the wrong bubble.
    const activeBubbles = bubbles.filter((b) => !b.isDeleted);
    const emptyIndex = activeBubbles.findIndex((b) => !b.dialogue?.trim());

    if (emptyIndex !== -1) {
      toast.error(
        `Bubble ${emptyIndex + 1} has no dialogue. Add text or delete it.`,
      );
      setSelectedBubbleId(activeBubbles[emptyIndex].id);
      return;
    }

    // Catches bubbles loaded from the API with fontId: null — new ones always
    // get a font assigned on creation.
    const noFontIndex = activeBubbles.findIndex((b) => !b.fontId);

    if (noFontIndex !== -1) {
      toast.error(
        `Bubble ${noFontIndex + 1} has no font. Select one before saving.`,
      );
      setSelectedBubbleId(activeBubbles[noFontIndex].id);
      return;
    }

    setIsSaving(true);

    try {
      const promises: Promise<unknown>[] = [];

      // Deletions come from the full list — activeBubbles excludes them.
      for (const bubble of bubbles) {
        if (bubble.isDeleted && !bubble.isNew) {
          promises.push(deleteBubble(bubble.id));
        }
      }

      // Creates and updates walk activeBubbles, so the index is exactly the
      // position shown in the sidebar. That index becomes sortOrder, which is
      // what the backend orders every bubble read by.
      activeBubbles.forEach((bubble, index) => {
        if (bubble.isNew) {
          promises.push(
            createBubble(pageId, {
              dialogue: bubble.dialogue || "",
              x: bubble.x || 0,
              y: bubble.y || 0,
              width: bubble.width || 0,
              height: bubble.height || 0,
              fontSize: bubble.fontSize ?? DEFAULT_FONT_SIZE,
              fontColor: bubble.fontColor ?? DEFAULT_FONT_COLOR,
              nameColor: bubble.nameColor ?? null,
              textAlign: bubble.textAlign ?? DEFAULT_TEXT_ALIGN,
              textVerticalAlign:
                bubble.textVerticalAlign ?? DEFAULT_TEXT_VERTICAL_ALIGN,
              textCase: bubble.textCase ?? DEFAULT_TEXT_CASE,
              fontId: bubble.fontId,
              sortOrder: index,
            }),
          );
          return;
        }

        // Renumber untouched bubbles too when their stored value is stale.
        // Without this, saving one edited bubble leaves a mix of old zeros and
        // new indexes — which sorts worse than all-zeros did.
        const needsRenumber = bubble.sortOrder !== index;

        if (bubble.isModified || needsRenumber) {
          promises.push(
            updateBubble(bubble.id, {
              dialogue: bubble.dialogue,
              x: bubble.x,
              y: bubble.y,
              width: bubble.width,
              height: bubble.height,
              fontSize: bubble.fontSize ?? DEFAULT_FONT_SIZE,
              fontColor: bubble.fontColor ?? DEFAULT_FONT_COLOR,
              nameColor: bubble.nameColor ?? null,
              textAlign: bubble.textAlign ?? DEFAULT_TEXT_ALIGN,
              textVerticalAlign:
                bubble.textVerticalAlign ?? DEFAULT_TEXT_VERTICAL_ALIGN,
              textCase: bubble.textCase ?? DEFAULT_TEXT_CASE,
              fontId: bubble.fontId,
              sortOrder: index,
            }),
          );
        }
      });

      await Promise.all(promises);
      toast.success("Saved successfully");

      // Invalidate queries to refresh detail page data
      queryClient.invalidateQueries({ queryKey: ["comic", comicId, "pages"] });
      queryClient.invalidateQueries({
        queryKey: ["comic", comicId, "page", pageId, "bubbles"],
      });

      // Reload bubbles to get real IDs for new bubbles
      await handleReset();
    } catch (err: any) {
      toast.error("Failed to save some changes: " + err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isComicLoading || isFontsLoading || isLoadingBubbles) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4 text-[#914A8C]">
          <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin" />
          <p className="font-bold">Loading Editor...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-neutral-50 text-neutral-800 p-8">
        <h2 className="text-2xl font-bold mb-4">Page not found</h2>
        <Button onClick={() => router.push(`/admin/comics/${comicId}`)}>
          Return to Comic
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50 overflow-hidden">
      <div className="p-4 pb-0 shrink-0">
        <BubbleMapperHeader
          comicId={comicId}
          pageNumber={page.pageNumber}
          hasUnsavedChanges={hasUnsavedChanges}
          hasBlockingIssue={hasBlockingIssue}
          isSaving={isSaving}
          onSave={handleSave}
          onReset={handleReset}
          onPreview={handlePreview}
        />
      </div>

      <div className="flex flex-1 overflow-hidden p-4 gap-4 h-full">
        {/* Left: Canvas */}
        <div className="flex-1 flex bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm overflow-hidden">
          <BubbleMapperCanvas
            artworkUrl={page.artworkUrl}
            artworkWidth={page.artworkWidth}
            artworkHeight={page.artworkHeight}
            bubbles={bubbles}
            fontStates={fontStates}
            selectedBubbleId={selectedBubbleId}
            previewName={previewName}
            onSelectBubble={setSelectedBubbleId}
            onUpdateBubble={handleUpdateBubble}
          />
        </div>

        {/* Right: Sidebar */}
        <BubbleSidebar
          bubbles={bubbles}
          artworkHeight={page.artworkHeight ?? 1536}
          selectedBubbleId={selectedBubbleId}
          onSelectBubble={setSelectedBubbleId}
          onAddBubble={handleAddBubble}
          onUpdateBubble={handleUpdateBubble}
          onDeleteBubble={handleDeleteBubble}
          fonts={fonts || []}
          previewLongName={previewLongName}
          onPreviewLongNameChange={setPreviewLongName}
        />
      </div>

      <BubblePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        pageId={pageId}
        pageNumber={page.pageNumber}
        bubbles={previewBubbles}
      />
    </div>
  );
}
