"use client";

import { requestBlogUploadUrl } from "@/app/actions/blog";
import { ShareImageField } from "@/components/admin/seo/ShareImageField";
import {
  CharCounter,
  SEO_TITLE_LIMIT,
  SEO_DESCRIPTION_LIMIT,
} from "@/components/admin/shared/CharCounter";

interface BlogShareFieldsProps {
  ogTitle: string;
  onOgTitleChange: (value: string) => void;
  ogDescription: string;
  onOgDescriptionChange: (value: string) => void;
  /** The saved share image or a local preview; null when there is none. */
  ogImageUrl: string | null;
  onOgImageUploaded: (key: string, previewUrl: string) => void;
  onOgImageRemove: () => void;
  /** What a blank share title / description falls back to, for the placeholders. */
  fallbackTitle: string;
  fallbackDescription: string;
  disabled: boolean;
}

/**
 * Share preview fields of a blog post (feature 13), used by the create and the edit page (two near-duplicate
 * forms, so the new markup lives here once). Styling follows the SEO block of those pages.
 */
export function BlogShareFields({
  ogTitle,
  onOgTitleChange,
  ogDescription,
  onOgDescriptionChange,
  ogImageUrl,
  onOgImageUploaded,
  onOgImageRemove,
  fallbackTitle,
  fallbackDescription,
  disabled,
}: BlogShareFieldsProps) {
  return (
    <div className="pt-6 border-t border-gray-100 space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-700">Share preview</h3>
        <p className="text-xs text-gray-400 font-medium mt-0.5">
          The card shown when this post is shared (WhatsApp, Facebook and
          others). All optional, blank uses the SEO fields above, then the post
          itself.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700">Share Title</label>
        <input
          type="text"
          value={ogTitle}
          onChange={(e) => onOgTitleChange(e.target.value)}
          disabled={disabled}
          placeholder={fallbackTitle || "Same as the SEO title"}
          maxLength={120}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#914A8C] focus:ring-2 focus:ring-[#914A8C]/20 focus:bg-white transition-all disabled:opacity-50"
        />
        <div className="flex justify-end">
          <CharCounter value={ogTitle} limit={SEO_TITLE_LIMIT} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700">Share Description</label>
        <textarea
          value={ogDescription}
          onChange={(e) => onOgDescriptionChange(e.target.value)}
          disabled={disabled}
          placeholder={fallbackDescription || "Same as the SEO description"}
          maxLength={320}
          rows={3}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#914A8C] focus:ring-2 focus:ring-[#914A8C]/20 focus:bg-white transition-all resize-none disabled:opacity-50"
        />
        <div className="flex justify-end">
          <CharCounter value={ogDescription} limit={SEO_DESCRIPTION_LIMIT} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700">Share Image</label>
        <ShareImageField
          imageUrl={ogImageUrl}
          disabled={disabled}
          requestUploadUrl={requestBlogUploadUrl}
          onUploaded={onOgImageUploaded}
          onRemove={onOgImageRemove}
          fallbackNote="Blank uses the cover image."
        />
      </div>
    </div>
  );
}
