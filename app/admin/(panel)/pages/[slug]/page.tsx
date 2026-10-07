"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useSitePage,
  useSaveSitePage,
  useToggleSitePageStatus,
} from "@/hooks/useSitePages";
import {
  SITE_PAGE_LABELS,
  SITE_PAGE_ROUTES,
  SITE_PAGE_SLUGS,
  type SitePage,
  type SitePageSlug,
} from "@/app/types/sitePage";
import { BlogEditor } from "@/components/admin/blog/BlogEditor";
import { getErrorMessage } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Save,
} from "lucide-react";

function isValidSlug(value: string): value is SitePageSlug {
  return (SITE_PAGE_SLUGS as string[]).includes(value);
}

export default function SitePageEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = use(params);

  // The slug comes off the URL so it can be anything. Screen it here and never
  // make the request at all, rather than letting the API 400.
  if (!isValidSlug(rawSlug)) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
          <h3 className="font-bold text-lg mb-1 text-amber-900">Unknown page</h3>
          <p className="text-sm text-amber-700 mb-5">
            &quot;{rawSlug}&quot; is not an editable page. Contact details live
            under Settings.
          </p>
          <Link
            href="/admin/pages"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Back to Pages
          </Link>
        </div>
      </div>
    );
  }

  return <SitePageLoader slug={rawSlug} />;
}

/**
 * Fetches the page, then hands it to the form.
 *
 * The form is keyed by the row's version so a save (or a refetch that actually
 * changed something) remounts it with fresh initial state. That avoids syncing
 * props into state entirely — and it is also what makes the TipTap editor pick
 * up new content, since it only reads `content` at mount.
 */
function SitePageLoader({ slug }: { slug: SitePageSlug }) {
  const { data: page, isLoading, isError, error } = useSitePage(slug);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-2 space-y-6">
        <Skeleton className="h-8 w-56 bg-[#F8E7D2]/80" />
        <Skeleton className="h-11 w-full bg-[#F8E7D2]/60" />
        <Skeleton className="h-[400px] w-full rounded-xl bg-[#F8E7D2]/60" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load this page</h3>
          <p className="text-sm text-red-600 mb-5">
            {getErrorMessage(error, "Unknown error")}
          </p>
          <Link
            href="/admin/pages"
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Back to Pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SitePageEditorForm
      key={`${page.slug}:${page.updatedAt ?? "unsaved"}`}
      slug={slug}
      page={page}
    />
  );
}

function SitePageEditorForm({
  slug,
  page,
}: {
  slug: SitePageSlug;
  page: SitePage;
}) {
  const savePage = useSaveSitePage();
  const toggleStatus = useToggleSitePageStatus();

  // Initialised from props once. The parent remounts this component whenever
  // the underlying row changes, so there is nothing to keep in sync.
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [isDirty, setIsDirty] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Leaving with unsaved edits loses a long document. The browser dialog is
  // the only thing that reliably catches a tab close as well as a navigation.
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const isSaved = page.id != null;

  // An empty TipTap document still serialises to "<p></p>", so a length check
  // on the raw HTML would treat a blank editor as filled.
  const bodyIsEmpty = body.replace(/<[^>]*>/g, "").trim().length === 0;
  const canSave = isDirty && title.trim().length > 0 && !bodyIsEmpty;

  const handleSave = async () => {
    if (!canSave || savePage.isPending) return;

    try {
      await savePage.mutateAsync({
        slug,
        payload: { title: title.trim(), body },
      });
      setIsDirty(false);
      toast.success(
        isSaved
          ? "Page saved"
          : "Page created — publish it when you are ready for it to go live"
      );
    } catch (err: unknown) {
      toast.error("Failed to save: " + getErrorMessage(err, "Server error"));
    }
  };

  const handleToggle = async () => {
    if (!isSaved || isToggling) return;
    setIsToggling(true);
    try {
      const updated = await toggleStatus.mutateAsync(slug);
      toast.success(updated.isActive ? "Page is now live" : "Page unpublished");
    } catch (err: unknown) {
      toast.error(
        "Could not change status: " + getErrorMessage(err, "Network error")
      );
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/pages"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#914A8C] hover:text-[#7a3e75] transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pages
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {SITE_PAGE_LABELS[slug]}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500">
              <code className="font-mono text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded">
                {SITE_PAGE_ROUTES[slug]}
              </code>
              {page.isActive && (
                <a
                  href={SITE_PAGE_ROUTES[slug]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#914A8C] hover:underline"
                >
                  View live
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-xs font-bold uppercase tracking-wide ${
                  page.isActive ? "text-emerald-600" : "text-neutral-400"
                }`}
              >
                {page.isActive ? "Published" : "Draft"}
              </span>
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#914A8C]" />
              ) : (
                <Switch
                  checked={page.isActive}
                  disabled={!isSaved}
                  onCheckedChange={handleToggle}
                  className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Publish page"
                />
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!canSave || savePage.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {savePage.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {!isSaved && (
        <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            This page has not been created yet. Save it once before you can
            publish it.
          </p>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label
          htmlFor="page-title"
          className="text-sm font-semibold text-neutral-900"
        >
          Page Title
        </label>
        <Input
          id="page-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setIsDirty(true);
          }}
          placeholder={SITE_PAGE_LABELS[slug]}
          maxLength={200}
          className="h-11 rounded-xl bg-white"
        />
        <p className="text-xs text-neutral-500">
          Shown as the heading at the top of the public page.
        </p>
      </div>

      {/* Body */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-neutral-900">Content</label>
        <BlogEditor
          content={page.body}
          onChange={(value) => {
            setBody(value);
            setIsDirty(true);
          }}
          allowImages={false}
          placeholder={`Write the ${SITE_PAGE_LABELS[slug].toLowerCase()} here...`}
          disabled={savePage.isPending}
        />
      </div>
    </div>
  );
}
