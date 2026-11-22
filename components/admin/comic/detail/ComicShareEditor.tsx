"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComicDetail } from "@/app/types/comic";
import { useUpdateComicSeo } from "@/hooks/useSeo";
import { requestComicOgImageUploadUrl } from "@/app/actions/seo";
import { ShareImageField } from "@/components/admin/seo/ShareImageField";
import { getErrorMessage } from "@/lib/utils";
import {
  CharCounter,
  SEO_TITLE_LIMIT,
  SEO_DESCRIPTION_LIMIT,
} from "@/components/admin/shared/CharCounter";

const ALT_MAX = 200;

interface ComicShareEditorProps {
  comic: ComicDetail;
}

/** One alt string per cover, padded or cut to the number of covers (a missing entry is blank). */
function altsFor(comic: ComicDetail): string[] {
  return comic.coverThumbnailUrls.map((_, i) => comic.coverThumbnailAlts?.[i] ?? "");
}

/**
 * Share preview (title, description, image) and the alt text of each cover. A sibling of ComicSeoEditor, not
 * part of the create wizard. Blank share fields fall back to the SEO fields and then to the first cover.
 */
export function ComicShareEditor({ comic }: ComicShareEditorProps) {
  const { mutateAsync: updateComicSeo, isPending } = useUpdateComicSeo();

  const [ogTitle, setOgTitle] = useState(comic.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(comic.ogDescription ?? "");
  const [alts, setAlts] = useState<string[]>(altsFor(comic));
  // Share image: the saved URL, or a local preview of one uploaded and not saved yet (its key waits in ogKey).
  // ogKey: undefined = unchanged, null = remove, string = new upload (the same convention as the blog cover).
  const [ogImage, setOgImage] = useState<string | null>(comic.ogImageUrl);
  const [ogKey, setOgKey] = useState<string | null | undefined>(undefined);

  // Re-seed when the saved row changes, not on every refetch (see ComicSeoEditor for why).
  const savedAlts = JSON.stringify(altsFor(comic));
  const [seeded, setSeeded] = useState({
    title: comic.ogTitle,
    description: comic.ogDescription,
    image: comic.ogImageUrl,
    alts: savedAlts,
  });
  if (
    seeded.title !== comic.ogTitle ||
    seeded.description !== comic.ogDescription ||
    seeded.image !== comic.ogImageUrl ||
    seeded.alts !== savedAlts
  ) {
    setSeeded({
      title: comic.ogTitle,
      description: comic.ogDescription,
      image: comic.ogImageUrl,
      alts: savedAlts,
    });
    setOgTitle(comic.ogTitle ?? "");
    setOgDescription(comic.ogDescription ?? "");
    setAlts(altsFor(comic));
    setOgImage(comic.ogImageUrl);
    setOgKey(undefined);
  }

  const isDirty =
    ogTitle.trim() !== (comic.ogTitle ?? "") ||
    ogDescription.trim() !== (comic.ogDescription ?? "") ||
    ogKey !== undefined ||
    JSON.stringify(alts.map((a) => a.trim())) !== savedAlts;

  const handleSave = async () => {
    try {
      await updateComicSeo({
        id: comic.id,
        data: {
          // "" -> null, never an empty string: null clears the override (same rule as ComicSeoEditor).
          ogTitle: ogTitle.trim() || null,
          ogDescription: ogDescription.trim() || null,
          ...(ogKey !== undefined ? { ogImageKey: ogKey } : {}),
          coverThumbnailAlts: alts.map((a) => a.trim()),
        },
      });
      toast.success("Share preview saved");
    } catch (err: unknown) {
      toast.error("Failed to save share preview: " + getErrorMessage(err, "Server error"));
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#914A8C]" />
          Share preview &amp; picture descriptions
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          The card shown when this comic is shared (WhatsApp, Facebook and
          others), and the text that describes each cover for people who cannot
          see it. All optional.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="comic-share-title" className="text-sm font-semibold text-neutral-900">
            Share title
          </label>
          <Input
            id="comic-share-title"
            value={ogTitle}
            onChange={(e) => setOgTitle(e.target.value)}
            disabled={isPending}
            maxLength={120}
            placeholder={comic.metaTitle || comic.title}
            className="h-11 rounded-xl bg-white"
          />
          <div className="flex justify-between gap-3">
            <p className="text-xs text-neutral-500">
              Blank uses the SEO title, then the comic title.
            </p>
            <CharCounter value={ogTitle} limit={SEO_TITLE_LIMIT} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="comic-share-description" className="text-sm font-semibold text-neutral-900">
            Share description
          </label>
          <Textarea
            id="comic-share-description"
            value={ogDescription}
            onChange={(e) => setOgDescription(e.target.value)}
            disabled={isPending}
            maxLength={320}
            rows={3}
            placeholder={comic.metaDescription || comic.description || ""}
            className="rounded-xl bg-white resize-none"
          />
          <div className="flex justify-between gap-3">
            <p className="text-xs text-neutral-500">
              Blank uses the SEO description, then the comic description.
            </p>
            <CharCounter value={ogDescription} limit={SEO_DESCRIPTION_LIMIT} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-neutral-900">
            Share image
          </label>
          <ShareImageField
            imageUrl={ogImage}
            disabled={isPending}
            requestUploadUrl={requestComicOgImageUploadUrl}
            onUploaded={(key, previewUrl) => {
              setOgKey(key);
              setOgImage(previewUrl);
            }}
            onRemove={() => {
              setOgKey(null);
              setOgImage(null);
            }}
            fallbackNote="Blank uses the first cover."
          />
        </div>

        <div className="space-y-3 pt-5 border-t border-neutral-100">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Cover descriptions (alt text)
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              One short sentence per cover, in the same order as the cover
              thumbnails above. Blank uses the comic title.
            </p>
          </div>
          {comic.coverThumbnailUrls.length === 0 && (
            <p className="text-xs text-neutral-500">
              This comic has no cover thumbnails yet.
            </p>
          )}
          {comic.coverThumbnailUrls.map((url, i) => (
            <div key={url} className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-14 w-auto max-w-[5rem] rounded-lg border border-neutral-200 object-contain bg-neutral-100 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <Input
                  value={alts[i] ?? ""}
                  onChange={(e) =>
                    setAlts((prev) => prev.map((a, j) => (j === i ? e.target.value : a)))
                  }
                  disabled={isPending}
                  maxLength={ALT_MAX}
                  aria-label={`Description of cover ${i + 1}`}
                  placeholder={`Cover ${i + 1}: ${comic.title}`}
                  className="h-10 rounded-xl bg-white"
                />
                <div className="flex justify-end">
                  <span className="text-xs tabular-nums text-neutral-400">
                    {(alts[i] ?? "").trim().length} / {ALT_MAX}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
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
              <Save className="w-4 h-4 mr-2" /> Save share preview
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
