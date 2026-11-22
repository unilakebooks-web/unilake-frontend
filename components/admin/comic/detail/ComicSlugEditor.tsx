"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Link as LinkIcon, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComicDetail } from "@/app/types/comic";
import { useUpdateComicSeo } from "@/hooks/useSeo";
import { normalizeSlug, validateSlug, SLUG_MAX_LENGTH } from "@/lib/comicSlug";
import { SITE_URL } from "@/components/share/shareUrl";
import { getErrorCode, getErrorMessage } from "@/lib/utils";

interface ComicSlugEditorProps {
  comic: ComicDetail;
}

/**
 * The comic's readable address. Its own card, not a field of ComicInfoEditor, for the same reason as
 * ComicSeoEditor: that editor's fields are shared with the create wizard, which must not get this.
 */
export function ComicSlugEditor({ comic }: ComicSlugEditorProps) {
  const { mutateAsync: updateComicSeo, isPending } = useUpdateComicSeo();

  const [slug, setSlug] = useState(comic.slug ?? "");
  // The server's refusal (a 409 when another comic uses the address). Cleared on the next keystroke.
  const [serverError, setServerError] = useState<string | null>(null);

  // Re-seed when the saved slug changes (after a save or a refetch), not on every refetch: see ComicSeoEditor.
  const [seeded, setSeeded] = useState(comic.slug);
  if (seeded !== comic.slug) {
    setSeeded(comic.slug);
    setSlug(comic.slug ?? "");
  }

  const normalized = normalizeSlug(slug);
  const ruleError = validateSlug(slug);
  const isDirty = normalized !== (comic.slug ?? "");
  const canSave = isDirty && !ruleError && !isPending;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await updateComicSeo({ id: comic.id, data: { slug: normalized } });
      setServerError(null);
      toast.success(
        comic.slug
          ? "Address saved. The old address now redirects to the new one"
          : "Address saved"
      );
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Server error");
      setServerError(message);
      toast.error(
        (getErrorCode(err) === "CONFLICT" ? "Address already in use: " : "Failed to save address: ") +
          message
      );
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-[#914A8C]" />
          Web address
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          The link customers see and share for this comic.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="comic-slug"
          className="text-sm font-semibold text-neutral-900"
        >
          Address
        </label>
        <Input
          id="comic-slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setServerError(null);
          }}
          disabled={isPending}
          maxLength={SLUG_MAX_LENGTH + 20}
          placeholder="the-alphabet-train"
          className="h-11 rounded-xl bg-white font-mono"
          aria-invalid={!!(ruleError && isDirty) || !!serverError}
        />
        <p className="text-xs text-neutral-500 break-all">
          Preview:{" "}
          <span className="font-mono text-neutral-800">
            {SITE_URL}/comic/{normalized || "…"}
          </span>
        </p>
        {isDirty && ruleError && (
          <p className="text-xs font-medium text-red-600">{ruleError}</p>
        )}
        {serverError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p>{serverError}</p>
          </div>
        )}
        <p className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-xl p-3">
          Changing the address is safe: the old address keeps working and
          automatically redirects to the new one. Still, change it rarely, and
          never to something unrelated to the title. Lower case letters,
          numbers and hyphens only.
        </p>
      </div>

      <div className="flex justify-end mt-6 pt-6 border-t border-neutral-100">
        <Button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold h-11 px-8 shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save address
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
