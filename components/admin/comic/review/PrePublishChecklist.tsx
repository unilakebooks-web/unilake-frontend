"use client";

import { ComicDetail, ComicStatus, CoverType } from "@/app/types/comic";
import { CheckCircle2, AlertCircle, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateComicStatus } from "@/hooks/useComics";
import { toast } from "sonner";
import { useCountries } from "@/hooks/useCountries";
import { findInvalidTokens } from "@/lib/dialogueTokens";

interface PrePublishChecklistProps {
  comic: ComicDetail;
}

export function PrePublishChecklist({ comic }: PrePublishChecklistProps) {
  const { mutateAsync: updateStatus, isPending } = useUpdateComicStatus();
  const { data: countries } = useCountries();

  // The backend only gates on thumbnails + at least one pricing rule. Every
  // other guarantee below is permanently this screen's responsibility.
  //
  // Grouped by country — a plain count of pricing rules can be satisfied by
  // four rules that all belong to one country while another has no price.
  //
  // A rule also has to carry an MRP. Rows created before that column existed
  // have none, and the storefront silently drops the strike-through for them —
  // so publishing one would ship a comic that quietly looks undiscounted.
  const isRuleComplete = (r: { mrp: string | null }) =>
    r.mrp !== null && parseFloat(r.mrp) > 0;

  const countriesMissingPricing = (countries ?? []).filter((c) => {
    const rules = comic.pricingRules.filter((r) => r.countryId === c.id);
    return (
      !rules.some(
        (r) => r.coverType === CoverType.HARDCOVER && isRuleComplete(r)
      ) ||
      !rules.some(
        (r) => r.coverType === CoverType.SOFTCOVER && isRuleComplete(r)
      )
    );
  });

  const pagesMissingArtwork = comic.pages.filter((p) => !p.artworkUrl);
  const pagesMissingMask = comic.pages.filter((p) => p.hasFace && !p.maskUrl);
  const previewCount = comic.pages.filter((p) => p.isPreviewPage).length;
  const bubblesMissingFont = comic.pages
    .flatMap((p) => p.bubbles)
    .filter((b) => !b.fontId);

  const bubblesWithInvalidTokens = comic.pages
    .flatMap((p) => p.bubbles)
    .filter((b) => findInvalidTokens(b.dialogue || "").length > 0);

  interface Check {
    id: string;
    title: string;
    ok: boolean;
    okText: string;
    failText: string;
    blocking: boolean;
  }

  const checks: Check[] = [
    {
      id: "thumbnails",
      title: "Thumbnails",
      ok: comic.coverThumbnailUrls.length > 0,
      okText: `${comic.coverThumbnailUrls.length} thumbnail(s) uploaded.`,
      failText: "At least one cover thumbnail is required.",
      blocking: true,
    },
    {
      id: "pricing",
      title: "Pricing",
      ok: !!countries && countriesMissingPricing.length === 0,
      okText: `All ${countries?.length ?? 0} countries have an MRP and price for both cover types.`,
      failText: !countries
        ? "Loading countries…"
        : `Missing MRP or price for: ${countriesMissingPricing
            .map((c) => c.name)
            .join(", ")}. Fix on the Pricing tab.`,
      blocking: true,
    },
    {
      id: "page-count",
      title: "Page Count",
      ok: comic.pages.length === comic.pageCount,
      okText: `All ${comic.pageCount} pages created.`,
      failText: `Expected ${comic.pageCount} pages, found ${comic.pages.length}.`,
      blocking: true,
    },
    {
      id: "artwork",
      title: "Artwork",
      ok: pagesMissingArtwork.length === 0,
      okText: "Every page has artwork.",
      failText: `Missing artwork on page(s): ${pagesMissingArtwork
        .map((p) => p.pageNumber)
        .join(", ")}.`,
      blocking: true,
    },
    {
      id: "masks",
      title: "Face Masks",
      ok: pagesMissingMask.length === 0,
      okText: "Every face page has a mask.",
      failText: `Page(s) ${pagesMissingMask
        .map((p) => p.pageNumber)
        .join(", ")} have "Has Face" on but no mask — the face will be placed incorrectly.`,
      blocking: true,
    },
    {
      id: "preview",
      title: "Preview Pages",
      ok: previewCount === comic.freePreviewPages,
      okText: `${previewCount} preview pages, matching the comic setting.`,
      failText: `${previewCount} page(s) flagged as preview but the comic promises ${comic.freePreviewPages}.`,
      blocking: true,
    },
    {
      id: "bubble-fonts",
      title: "Bubble Fonts",
      ok: bubblesMissingFont.length === 0,
      okText: "Every bubble has a font.",
      failText: `${bubblesMissingFont.length} bubble(s) have no font assigned.`,
      blocking: false,
    },
    {
      id: "dialogue-tokens",
      title: "Dialogue Tokens",
      ok: bubblesWithInvalidTokens.length === 0,
      okText: "All dialogue uses valid tokens.",
      failText: `${bubblesWithInvalidTokens.length} bubble(s) contain unknown {…} tokens. Check for typos like {Name} or {pronoun_subj}.`,
      blocking: false,
    },
  ];

  const blockingFailures = checks.filter((c) => c.blocking && !c.ok);
  const isPublishable =
    blockingFailures.length === 0 && comic.status !== ComicStatus.PUBLISHED;

  const handlePublish = async () => {
    if (!isPublishable) return;
    try {
      await updateStatus({ id: comic.id, status: ComicStatus.PUBLISHED });
      toast.success("Comic published successfully! It is now live.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish comic");
    }
  };

  const ChecklistItem = ({
    title,
    description,
    isValid,
    errorText,
    isAdvisory = false,
  }: {
    title: string;
    description: string;
    isValid: boolean;
    errorText: string;
    isAdvisory?: boolean;
  }) => {
    // A failed advisory check is amber, not red — it warns without blocking.
    const tone = isValid
      ? { box: "bg-emerald-50 border-emerald-200", head: "text-emerald-900", body: "text-emerald-700", icon: "text-emerald-500" }
      : isAdvisory
        ? { box: "bg-amber-50 border-amber-200", head: "text-amber-900", body: "text-amber-700 font-medium", icon: "text-amber-500" }
        : { box: "bg-red-50 border-red-200", head: "text-red-900", body: "text-red-700 font-medium", icon: "text-red-500" };

    return (
      <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${tone.box}`}>
        {isValid ? (
          <CheckCircle2 className={`w-6 h-6 shrink-0 ${tone.icon}`} />
        ) : (
          <AlertCircle className={`w-6 h-6 shrink-0 ${tone.icon}`} />
        )}
        <div>
          <h4 className={`font-bold text-sm ${tone.head}`}>
            {title}
            {!isValid && isAdvisory && (
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                Advisory
              </span>
            )}
          </h4>
          <p className={`text-xs mt-1 ${tone.body}`}>
            {isValid ? description : errorText}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Publish Review</h2>
          <p className="text-sm text-neutral-500">
            Check if the comic meets all requirements before publishing to the storefront.
          </p>
        </div>
        {comic.status === ComicStatus.PUBLISHED ? (
          <div className="bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-xl flex items-center border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Currently Live
          </div>
        ) : (
          <Button
            onClick={handlePublish}
            disabled={!isPublishable || isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm px-8 h-12 text-base transition-all active:scale-95"
          >
            {isPending ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Publishing...</>
            ) : (
              <><Globe className="w-5 h-5 mr-2" /> Publish Comic</>
            )}
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {checks.map((check) => (
          <ChecklistItem
            key={check.id}
            title={check.title}
            description={check.okText}
            isValid={check.ok}
            errorText={check.failText}
            isAdvisory={!check.blocking}
          />
        ))}
      </div>

      {!isPublishable && comic.status !== ComicStatus.PUBLISHED && (
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            You must resolve all red issues above before the comic can be published.
          </p>
        </div>
      )}
    </div>
  );
}
