"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComicDetail } from "@/app/types/comic";
import { useUpdateComic } from "@/hooks/useComics";
import {
  CharCounter,
  SEO_TITLE_LIMIT,
  SEO_DESCRIPTION_LIMIT,
} from "@/components/admin/shared/CharCounter";

interface ComicSeoEditorProps {
  comic: ComicDetail;
}

/**
 * Deliberately its own card rather than two more fields inside ComicInfoEditor.
 *
 * That editor renders <ComicDetailsFields />, which is SHARED with the
 * create-comic wizard — adding SEO inputs there would surface them during
 * creation too, which is not what was asked for. Keeping this separate also
 * keeps it clear of that form's freePreviewPages/pageCount cross-validation,
 * which has nothing to do with SEO.
 */
export function ComicSeoEditor({ comic }: ComicSeoEditorProps) {
  const { mutateAsync: updateComic, isPending } = useUpdateComic();

  const [metaTitle, setMetaTitle] = useState(comic.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    comic.metaDescription ?? ""
  );

  // The comic comes from a query that refetches (saving the video or the
  // thumbnails invalidates it), so the inputs have to re-seed when the row
  // itself changes — but NOT on every refetch, or a refetch mid-typing would
  // wipe what the admin is writing.
  //
  // This is React's documented "adjusting state when a prop changes" pattern:
  // compare against the last seen values during render. An effect doing the
  // same job would render once with stale values and then immediately render
  // again, which is what react-hooks/set-state-in-effect flags.
  const [seeded, setSeeded] = useState({
    title: comic.metaTitle,
    description: comic.metaDescription,
  });

  if (
    seeded.title !== comic.metaTitle ||
    seeded.description !== comic.metaDescription
  ) {
    setSeeded({ title: comic.metaTitle, description: comic.metaDescription });
    setMetaTitle(comic.metaTitle ?? "");
    setMetaDescription(comic.metaDescription ?? "");
  }

  const isDirty =
    metaTitle.trim() !== (comic.metaTitle ?? "") ||
    metaDescription.trim() !== (comic.metaDescription ?? "");

  const handleSave = async () => {
    try {
      await updateComic({
        id: comic.id,
        data: {
          // "" -> null, never an empty string: the API rejects empty strings,
          // and null is what clears the override so the comic falls back to
          // its own title/description.
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
        },
      });
      toast.success("SEO details saved");
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Unknown error";
      toast.error("Failed to save SEO details: " + message);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex justify-between items-start mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-[#914A8C]" />
            Search &amp; Sharing (SEO)
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            What Google shows, and the preview card when someone shares this
            comic on WhatsApp. Both optional — leave blank to use the comic’s own
            title and description.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-neutral-900">
            SEO title
          </label>
          <Input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            disabled={isPending}
            placeholder={comic.title}
            className="h-11 rounded-xl bg-white"
          />
          <div className="flex justify-between gap-3">
            <p className="text-xs text-neutral-500">
              Blank uses: <span className="font-medium">{comic.title}</span>
            </p>
            <CharCounter value={metaTitle} limit={SEO_TITLE_LIMIT} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-neutral-900">
            SEO description
          </label>
          <Textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            disabled={isPending}
            rows={3}
            placeholder={comic.description ?? "A short description of this comic…"}
            className="rounded-xl bg-white resize-none"
          />
          <div className="flex justify-between gap-3">
            <p className="text-xs text-neutral-500">
              {comic.description
                ? "Blank uses the comic’s description."
                : "This comic has no description — add one, or set an SEO description here."}
            </p>
            <CharCounter
              value={metaDescription}
              limit={SEO_DESCRIPTION_LIMIT}
            />
          </div>
        </div>

        {/* <p className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-xl p-3">
          The share image is taken from this comic’s first cover thumbnail
          automatically — nothing to upload here.
        </p> */}
      </div>

      <div className="flex justify-end mt-6 pt-6 border-t border-neutral-100">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold h-11 px-8 shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save SEO
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
