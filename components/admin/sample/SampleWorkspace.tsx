"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Download,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionPreview } from "@/hooks/useSessionPreview";
import { useDiscardSample } from "@/hooks/useSamples";
import { SampleDiscardDialog } from "./SampleDiscardDialog";
import { downloadSamplePdf } from "@/app/actions/sample";
import { getErrorMessage } from "@/lib/utils";
import { MAX_SAMPLE_VERSIONS, estimateSampleCost } from "./sampleConfig";

interface SampleWorkspaceProps {
  sessionId: string;
  onClose: () => void;
}

export function SampleWorkspace({ sessionId, onClose }: SampleWorkspaceProps) {
  const {
    snapshot,
    isLoading,
    error,
    status,
    triggerGeneration,
    regeneratePage,
  } = useSessionPreview(sessionId);
  const discard = useDiscardSample();
  const [discardOpen, setDiscardOpen] = useState(false);

  // The version the admin picked per page; a page without a pick uses its newest finished version.
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [busyPage, setBusyPage] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [starting, setStarting] = useState(false);

  if (isLoading)
    return (
      <p className="text-sm font-semibold text-[#914A8C]/70">
        Loading the sample...
      </p>
    );
  if (error || !snapshot) {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
        <AlertCircle className="w-4 h-4" /> This sample could not be loaded. It
        may have been deleted.
        <Button
          variant="outline"
          onClick={onClose}
          className="ml-2 cursor-pointer"
        >
          Back
        </Button>
      </div>
    );
  }

  const pages = [...snapshot.pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const facePages = pages.filter((p) => p.hasFace).length;
  // Ended: past its time, or discarded. A sample whose pages all failed is NOT ended: it can still be
  // regenerated or discarded, and it keeps counting against the limits until then.
  const expired = snapshot.isExpired;
  const generating = !expired && status === "GENERATING_PREVIEW";
  const canGenerate = !expired && status === "PHOTO_UPLOADED";
  const allFailed = !expired && status === "FAILED";

  const finished = (page: (typeof pages)[number]) =>
    page.variants.filter((v) => v.status === "SD_READY");
  const chosenFor = (page: (typeof pages)[number]) => {
    const done = finished(page);
    return (
      done.find((v) => v.pageVersionId === picked[page.pageId]) ??
      done[done.length - 1] ??
      null
    );
  };
  const selections = pages.flatMap((p) => {
    const v = chosenFor(p);
    return v ? [{ pageId: p.pageId, pageVersionId: v.pageVersionId }] : [];
  });

  const handleGenerate = async () => {
    setStarting(true);
    try {
      await triggerGeneration();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not start generating."));
    } finally {
      setStarting(false);
    }
  };

  const handleRegenerate = async (pageNumber: number) => {
    setBusyPage(pageNumber);
    try {
      await regeneratePage(pageNumber);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not regenerate this page."));
    } finally {
      setBusyPage(null);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadSamplePdf(
        sessionId,
        selections,
        // The name is typed by an admin: keep characters out that a file name cannot hold.
        `sample-${(snapshot.childName ?? "book").replace(/[\\/:*?"<>|]/g, "_")}.pdf`,
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not build the PDF."));
    } finally {
      setDownloading(false);
    }
  };

  const handleDiscard = async () => {
    try {
      await discard.mutateAsync(sessionId);
      toast.success(
        "Sample discarded. Its files are deleted from storage within a few minutes (a little later if a page is still generating).",
      );
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not discard the sample."));
      setDiscardOpen(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#914A8C] uppercase tracking-wide">
            Sample for {snapshot.childName ?? "a child"}
          </h2>
          <p className="text-xs font-semibold text-[#914A8C]/75">
            {expired
              ? "This sample has ended."
              : `Files are deleted after ${new Date(snapshot.expiresAt).toLocaleString()}. Download the PDF before then.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Back to samples
          </Button>
          <Button
            onClick={handleDownload}
            disabled={selections.length === 0 || downloading || expired}
            className="bg-[#914A8C] text-white cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="ml-2">Download PDF ({selections.length})</span>
          </Button>
          {!expired && (
            <Button
              variant="outline"
              onClick={() => setDiscardOpen(true)}
              disabled={discard.isPending}
              className="text-red-600 border-red-200 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="ml-2">Discard</span>
            </Button>
          )}
        </div>
      </div>

      {!expired &&
        selections.length > 0 &&
        selections.length < pages.length && (
          <p className="text-xs font-semibold text-[#914A8C]/80">
            The PDF will only contain the {selections.length} of {pages.length}{" "}
            pages that have a finished image.
          </p>
        )}

      {canGenerate && (
        <div className="rounded-xl bg-[#FFD54A]/25 p-4 text-sm font-semibold text-[#914A8C] space-y-3">
          <p>
            Ready to generate {pages.length} page{pages.length === 1 ? "" : "s"}
            . Estimated cost: about ${estimateSampleCost(facePages)}.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={starting}
            className="bg-[#914A8C] text-white cursor-pointer"
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span className={starting ? "ml-2" : ""}>Generate</span>
          </Button>
        </div>
      )}

      {status === "CREATED" && (
        <p className="text-sm font-semibold text-[#914A8C]/80">
          This sample has no photo yet. Discard it and create a new one.
        </p>
      )}
      {pages.length === 0 && !expired && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          Every page of this sample was removed from the book. Discard it and
          create a new one.
        </p>
      )}
      {allFailed && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          Generation failed for every page. Regenerate a page to try again, or
          discard this sample.
        </p>
      )}
      {generating && (
        <p className="flex items-center gap-2 text-sm font-semibold text-[#914A8C]">
          <Loader2 className="w-4 h-4 animate-spin" /> Generating. Pages appear
          as they finish.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => {
          const done = finished(page);
          const current = chosenFor(page);
          const working = page.variants.some(
            (v) => v.status !== "SD_READY" && v.status !== "FAILED",
          );
          const failed =
            !working &&
            done.length === 0 &&
            page.variants.some((v) => v.status === "FAILED");
          const atCap = page.variants.length >= MAX_SAMPLE_VERSIONS;
          const shown =
            current?.displayImageUrl ?? current?.finalImageUrl ?? null;
          return (
            <div
              key={page.pageId}
              className="rounded-2xl border border-[#914A8C]/20 bg-white p-3 space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#914A8C]">
                <span>Page {page.pageNumber}</span>
                <span className="font-semibold opacity-70">
                  {page.hasFace ? "with face" : "no face"}
                </span>
              </div>
              <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#914A8C]/5 flex items-center justify-center">
                {shown ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shown}
                    alt={`Page ${page.pageNumber}`}
                    className="h-full w-full object-contain"
                  />
                ) : working ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#914A8C]/60" />
                ) : failed ? (
                  <span className="px-3 text-center text-xs font-semibold text-red-600">
                    Generation failed
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#914A8C]/50">
                    Not generated yet
                  </span>
                )}
              </div>
              {done.length > 1 && (
                <div className="flex gap-1.5">
                  {done.map((v, i) => (
                    <button
                      key={v.pageVersionId}
                      type="button"
                      onClick={() =>
                        setPicked((s) => ({
                          ...s,
                          [page.pageId]: v.pageVersionId,
                        }))
                      }
                      aria-pressed={current?.pageVersionId === v.pageVersionId}
                      aria-label={`Page ${page.pageNumber}, version ${i + 1}`}
                      className={`h-7 w-7 rounded-lg text-xs font-bold cursor-pointer ${
                        current?.pageVersionId === v.pageVersionId
                          ? "bg-[#914A8C] text-white"
                          : "border border-[#914A8C]/30 text-[#914A8C]"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
              {!expired && !canGenerate && status !== "CREATED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerate(page.pageNumber)}
                  disabled={working || atCap || busyPage === page.pageNumber}
                  className="w-full cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="ml-2">
                    {atCap
                      ? `Limit of ${MAX_SAMPLE_VERSIONS} reached`
                      : "Regenerate"}
                  </span>
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <SampleDiscardDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        isPending={discard.isPending}
        onConfirm={handleDiscard}
      />
    </div>
  );
}
