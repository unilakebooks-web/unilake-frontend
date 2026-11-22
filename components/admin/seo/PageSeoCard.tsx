"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSavePageSeo } from "@/hooks/useSeo";
import { requestPageSeoUploadUrl } from "@/app/actions/seo";
import { ShareImageField } from "@/components/admin/seo/ShareImageField";
import { getErrorMessage } from "@/lib/utils";
import {
  PAGE_SEO_LABELS,
  PAGE_SEO_ROUTES,
  type PageSeo,
} from "@/app/types/seo";
import {
  CharCounter,
  SEO_TITLE_LIMIT,
  SEO_DESCRIPTION_LIMIT,
} from "@/components/admin/shared/CharCounter";

const ALT_MAX = 200;

/**
 * One page's search and share text. The parent keys this by slug and updatedAt, so a save remounts it with the
 * fresh row and there is no prop-to-state syncing (the same approach as the Pages editor).
 */
export function PageSeoCard({ page }: { page: PageSeo }) {
  const savePageSeo = useSavePageSeo();

  const [metaTitle, setMetaTitle] = useState(page.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(page.metaDescription ?? "");
  const [ogTitle, setOgTitle] = useState(page.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(page.ogDescription ?? "");
  const [ogImageAlt, setOgImageAlt] = useState(page.ogImageAlt ?? "");
  // Share image: the saved URL or a local preview. Key: undefined = unchanged, null = remove, string = new upload.
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(page.ogImageUrl);
  const [ogImageKey, setOgImageKey] = useState<string | null | undefined>(undefined);

  const isSaved = page.id !== null;
  const isDirty =
    metaTitle.trim() !== (page.metaTitle ?? "") ||
    metaDescription.trim() !== (page.metaDescription ?? "") ||
    ogTitle.trim() !== (page.ogTitle ?? "") ||
    ogDescription.trim() !== (page.ogDescription ?? "") ||
    ogImageAlt.trim() !== (page.ogImageAlt ?? "") ||
    ogImageKey !== undefined;

  const handleSave = async () => {
    try {
      await savePageSeo.mutateAsync({
        slug: page.slug,
        payload: {
          // "" -> null: null clears a field, and the page falls back to its built-in text.
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
          ogTitle: ogTitle.trim() || null,
          ogDescription: ogDescription.trim() || null,
          ogImageAlt: ogImageAlt.trim() || null,
          ...(ogImageKey !== undefined ? { ogImageKey } : {}),
        },
      });
      toast.success(`${PAGE_SEO_LABELS[page.slug]} saved`);
    } catch (err: unknown) {
      toast.error("Failed to save: " + getErrorMessage(err, "Server error"));
    }
  };

  const isPending = savePageSeo.isPending;
  const labelClass = "text-sm font-semibold text-neutral-900";

  return (
    <section className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">
            {PAGE_SEO_LABELS[page.slug]}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
            <code className="font-mono text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded">
              {PAGE_SEO_ROUTES[page.slug]}
            </code>
            <a
              href={PAGE_SEO_ROUTES[page.slug]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#914A8C] hover:underline"
            >
              View
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        {!isSaved && (
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            Not saved yet, the page uses its built-in text
          </span>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor={`seo-${page.slug}-title`} className={labelClass}>
            Search title
          </label>
          <Input
            id={`seo-${page.slug}-title`}
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            disabled={isPending}
            maxLength={120}
            placeholder="Blank uses the page's built-in title"
            className="h-11 rounded-xl bg-white"
          />
          <div className="flex justify-end">
            <CharCounter value={metaTitle} limit={SEO_TITLE_LIMIT} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`seo-${page.slug}-description`} className={labelClass}>
            Search description
          </label>
          <Textarea
            id={`seo-${page.slug}-description`}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            disabled={isPending}
            maxLength={320}
            rows={3}
            placeholder="Blank uses the page's built-in description"
            className="rounded-xl bg-white resize-none"
          />
          <div className="flex justify-end">
            <CharCounter value={metaDescription} limit={SEO_DESCRIPTION_LIMIT} />
          </div>
        </div>

        <div className="space-y-5 pt-5 border-t border-neutral-100">
          <p className="text-xs text-neutral-500">
            Share preview: the card shown when this page is shared. Blank uses
            the search text above.
          </p>

          <div className="space-y-1.5">
            <label htmlFor={`seo-${page.slug}-og-title`} className={labelClass}>
              Share title
            </label>
            <Input
              id={`seo-${page.slug}-og-title`}
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              disabled={isPending}
              maxLength={120}
              placeholder={metaTitle || "Same as the search title"}
              className="h-11 rounded-xl bg-white"
            />
            <div className="flex justify-end">
              <CharCounter value={ogTitle} limit={SEO_TITLE_LIMIT} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`seo-${page.slug}-og-description`} className={labelClass}>
              Share description
            </label>
            <Textarea
              id={`seo-${page.slug}-og-description`}
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              disabled={isPending}
              maxLength={320}
              rows={3}
              placeholder={metaDescription || "Same as the search description"}
              className="rounded-xl bg-white resize-none"
            />
            <div className="flex justify-end">
              <CharCounter value={ogDescription} limit={SEO_DESCRIPTION_LIMIT} />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className={labelClass}>Share image</span>
            <ShareImageField
              imageUrl={ogImageUrl}
              disabled={isPending}
              requestUploadUrl={requestPageSeoUploadUrl}
              onUploaded={(key, previewUrl) => {
                setOgImageKey(key);
                setOgImageUrl(previewUrl);
              }}
              onRemove={() => {
                setOgImageKey(null);
                setOgImageUrl(null);
              }}
              fallbackNote="Blank uses the site's default share image."
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={`seo-${page.slug}-og-alt`} className={labelClass}>
              Share image description (alt text)
            </label>
            <Input
              id={`seo-${page.slug}-og-alt`}
              value={ogImageAlt}
              onChange={(e) => setOgImageAlt(e.target.value)}
              disabled={isPending}
              maxLength={ALT_MAX}
              placeholder="Describe the image for people who cannot see it"
              className="h-11 rounded-xl bg-white"
            />
            <div className="flex justify-end">
              <span className="text-xs tabular-nums text-neutral-400">
                {ogImageAlt.trim().length} / {ALT_MAX}
              </span>
            </div>
          </div>
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
              <Save className="w-4 h-4 mr-2" /> Save {PAGE_SEO_LABELS[page.slug]}
            </>
          )}
        </Button>
      </div>
    </section>
  );
}
