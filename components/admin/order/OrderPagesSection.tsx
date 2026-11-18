"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getErrorCode } from "@/lib/utils";
import { useAdminOrderPages, useRegenerateOrderPages } from "@/hooks/useOrders";
import type {
  AdminOrderDetail,
  AdminOrderPage,
  AdminOrderPages,
  AdminPageStateName,
  RegenerateOrderPagesResult,
} from "@/app/types/order";
import { RegeneratePagesDialog } from "./RegeneratePagesDialog";

// The section shows what the server sends and holds no thresholds of its own: whether a
// page can be restarted, whether it needs "Restart anyway" and until when are all decided
// by the backend (utils/pageRecovery.ts).

const STATE_STYLE: Record<
  AdminPageStateName,
  { label: string; className: string }
> = {
  READY: {
    label: "Ready",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  BLOCKED: {
    label: "Blocked",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  WAITING: {
    label: "Waiting in the queue",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  IN_PROGRESS: {
    label: "Being made",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  STUCK: {
    label: "Stuck",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  NOT_STARTED: {
    label: "Not started",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
};

const PROBLEM_STATES: AdminPageStateName[] = [
  "FAILED",
  "STUCK",
  "BLOCKED",
  "NOT_STARTED",
];

const SKIP_TEXT: Record<string, string> = {
  FINISHED: "already finished",
  ALREADY_RUNNING: "already running",
  CHANGED: "changed while restarting",
  COOLING_DOWN: "restarted or failed a few minutes ago",
  NOT_IN_BOOK: "not part of the book",
};

// A non-breaking space keeps "1:51 AM" on one line.
const clock = (iso: string) =>
  format(new Date(iso), "h:mm a").replace(" ", "\u00a0");

function summaryLine(s: AdminOrderPages["summary"]) {
  const parts: [number, string][] = [
    [s.ready, "ready"],
    [s.inProgress, "being made"],
    [s.waiting, "waiting"],
    [s.stuck, "stuck"],
    [s.blocked, "blocked"],
    [s.failed, "failed"],
    [s.notStarted, "not started"],
  ];
  return parts
    .filter(([n]) => n > 0)
    .map(([n, label]) => `${n} ${label}`)
    .join(", ");
}

function PageRow({
  page,
  busy,
  onRestart,
}: {
  page: AdminOrderPage;
  busy: boolean;
  onRestart: (page: AdminOrderPage) => void;
}) {
  const style = STATE_STYLE[page.state];
  const label =
    page.state === "READY" && page.retryRunning
      ? "Ready (a retry is running)"
      : style.label;

  return (
    <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-white px-4 py-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-neutral-900 text-sm">
            Page {page.pageNumber}
          </span>
          {page.isPreviewPage && (
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
              free preview
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap",
              style.className,
            )}
          >
            {label}
          </span>
        </div>
        {page.state === "BLOCKED" && (
          <p className="text-xs text-amber-800">
            A retry of this page is stuck and holds the book back.
          </p>
        )}
        {page.cooldownEndsAt && page.restartable && (
          <p className="text-xs text-amber-800">
            Restarted or failed a few minutes ago. Can be restarted at{" "}
            {clock(page.cooldownEndsAt)}.
          </p>
        )}
        {page.lastError && (
          <p
            className="text-xs text-neutral-500 break-words line-clamp-2"
            title={page.lastError}
          >
            {page.state === "IN_PROGRESS" || page.state === "WAITING"
              ? "Previous error (before the restart)"
              : "Last error"}
            : {page.lastError}
          </p>
        )}
      </div>

      {page.restartable && (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => onRestart(page)}
          aria-label={`Restart page ${page.pageNumber}${page.requiresForce ? " anyway" : ""}`}
          className={cn(
            "rounded-xl font-semibold h-9 px-4 shrink-0 self-start sm:self-center",
            page.requiresForce
              ? "border-amber-600 text-amber-900 hover:bg-amber-50"
              : "border-[#914A8C]/40 text-[#914A8C] hover:bg-[#914A8C]/10",
          )}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {page.requiresForce ? "Restart anyway" : "Restart"}
        </Button>
      )}
    </li>
  );
}

function PagesBody({ order }: { order: AdminOrderDetail }) {
  const { data, error, isLoading, watchAgain, watchStopped, refetch } =
    useAdminOrderPages(order.id);
  const regenerate = useRegenerateOrderPages(order.id, watchAgain);

  const [dialog, setDialog] = useState<{
    mode: "restart" | "finish";
    pages: AdminOrderPage[];
    wholeBook: boolean;
    /** Frozen when the dialog opened, so its button cannot change under the admin's cursor. */
    needsForce: boolean;
  } | null>(null);
  // Open or closed is kept apart from the dialog's content, so while it fades out it still
  // shows what it showed (not "Restart 0 pages?").
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [result, setResult] = useState<RegenerateOrderPagesResult | null>(null);
  const [showReady, setShowReady] = useState(false);

  // An older backend (404) or an outage must never break the order page: say it once in
  // the console and show nothing.
  useEffect(() => {
    if (error)
      console.warn(
        "[Order pages] Could not load the pages of this order:",
        error,
      );
  }, [error]);

  // The green "restarted" banner is true only while the restart is running: once the pages
  // have been seen running and are not any more (finished, or failed again), it goes.
  const sawRunning = useRef(false);
  const resultAt = useRef(0);
  useEffect(() => {
    if (!result) {
      sawRunning.current = false;
      resultAt.current = 0;
      return;
    }
    if (resultAt.current === 0) resultAt.current = Date.now();
    const running = data?.pages.some(
      (p) =>
        p.state === "IN_PROGRESS" || p.state === "WAITING" || p.retryRunning,
    );
    if (running) sawRunning.current = true;
    // Gone once the pages were seen running and are not any more, or when a check some time
    // later finds nothing running (they failed again before a check caught them running).
    else if (sawRunning.current || Date.now() - resultAt.current > 20_000) {
      setResult(null);
    }
  }, [result, data]);

  const groups = useMemo(() => {
    const pages = data?.pages ?? [];
    return {
      problems: pages.filter((p) => PROBLEM_STATES.includes(p.state)),
      running: pages.filter(
        (p) => p.state === "IN_PROGRESS" || p.state === "WAITING",
      ),
      ready: pages.filter((p) => p.state === "READY"),
    };
  }, [data]);

  // A first load that fails hides the section (older backend, outage). A later failure keeps
  // the last good list on screen rather than making it vanish in the middle of a restart.
  if (error && !data) return null;

  if (isLoading || !data) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 text-[#914A8C]">
          <BookOpen className="w-4 h-4" />
          <h2 className="font-bold uppercase text-xs tracking-wider">
            Book pages
          </h2>
          <Loader2 className="w-4 h-4 animate-spin ml-1" aria-hidden />
          <span className="sr-only">Loading pages</span>
        </div>
      </div>
    );
  }

  const restartable = data.pages.filter((p) => p.restartable);
  // The server restarts every restartable paid page together when the session failed after
  // payment (or went back to the preview stage), or when a payment's pages were never started.
  const groupReason: "failed" | "stalled" | null = [
    "FAILED",
    "PREVIEW_READY",
    "GENERATING_PREVIEW",
  ].includes(data.sessionStatus)
    ? "failed"
    : data.sessionStatus === "PAID"
      ? "stalled"
      : null;
  const restoresSession = groupReason !== null;
  const inProgress =
    groups.running.length > 0 || data.pages.some((p) => p.retryRunning);

  // A failed session restarts every failed page together (the customer is told the book is
  // ready only when it is): the dialog lists them all and asks for "Restart anyway" if any
  // of them is cooling down, exactly as the server will.
  const openRestart = (pages: AdminOrderPage[], wholeBook: boolean) => {
    const list =
      restoresSession && !wholeBook
        ? data.pages.filter(
            (p) =>
              p.restartable &&
              (!p.isPreviewPage ||
                pages.some((n) => n.pageNumber === p.pageNumber)),
          )
        : pages;
    setDialogError(null);
    setDialogOpen(true);
    setDialog({
      mode: "restart",
      pages: list,
      wholeBook,
      needsForce: list.some((p) => p.requiresForce),
    });
    refetch(); // so a cooldown that has just ended is not shown as still running
  };

  const confirm = async () => {
    if (!dialog) return;
    setDialogError(null);
    try {
      const input =
        dialog.mode === "finish"
          ? { repairOnly: true }
          : {
              ...(dialog.wholeBook
                ? {}
                : { pageNumbers: dialog.pages.map((p) => p.pageNumber) }),
              ...(dialog.needsForce && { force: true }),
            };
      const outcome = await regenerate.mutateAsync(input);
      setDialogOpen(false);
      setResult(outcome);
      if (outcome.queued.length > 0 || outcome.repaired) {
        toast.success(outcome.message ?? "Done.");
      } else {
        toast.info(outcome.message ?? "Nothing was restarted.");
      }
    } catch (err) {
      const { message } = (err ?? {}) as { message?: string };
      setDialogError(message ?? "Could not restart the pages.");
      // The server found a page cooling down that the dialog did not know about (it changed
      // while the dialog was open): offer the override now instead of repeating the refusal.
      // Only the cooldown refusal (its own code), never a queue failure whose text also says it.
      if (getErrorCode(err) === "COOLING_DOWN") {
        setDialog((d) => (d ? { ...d, needsForce: true } : d));
      }
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#914A8C]">
            <BookOpen className="w-4 h-4" />
            <h2 className="font-bold uppercase text-xs tracking-wider">
              Book pages
            </h2>
          </div>
          {restoresSession && restartable.length > 1 && (
            <p className="mt-1 text-xs text-neutral-600">
              {groupReason === "failed"
                ? "This book failed, so its failed pages are restarted together."
                : "This payment's pages were never started, so they are started together."}
            </p>
          )}
          <p className="mt-1 text-sm font-semibold text-neutral-800">
            {summaryLine(data.summary) || "No pages found for this book."}
          </p>
        </div>

        {restartable.length > 0 && (
          <Button
            type="button"
            disabled={regenerate.isPending}
            onClick={() => openRestart(restartable, true)}
            className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold h-auto min-h-10 py-2 px-5 shadow-sm whitespace-normal text-left w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4 mr-2 shrink-0" />
            Restart all failed and stuck pages ({restartable.length})
          </Button>
        )}
      </div>

      {!data.canRegenerate && data.blockedReason && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <p>{data.blockedReason}</p>
        </div>
      )}

      {error && data && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <TriangleAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <p>Could not refresh the pages, so this list may be out of date.</p>
          <button
            type="button"
            onClick={() => {
              watchAgain();
              refetch();
            }}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {watchStopped && inProgress && !error && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700"
        >
          <p>
            This tab stopped checking by itself after 30 minutes, so the list
            may be out of date.
          </p>
          <button
            type="button"
            onClick={() => {
              watchAgain();
              refetch();
            }}
            className="font-semibold text-[#914A8C] underline"
          >
            Check again
          </button>
        </div>
      )}

      {data.canRegenerate && !data.queueAvailable && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <p>
            The queue cannot be reached right now, so pages cannot be restarted.
            Try again in a few minutes.
          </p>
        </div>
      )}

      {data.needsRepair && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#914A8C]/20 bg-[#914A8C]/5 p-4">
          <p className="text-sm text-neutral-800">
            <span className="font-bold">
              All pages are ready, but the order has not moved on.
            </span>{" "}
            The customer cannot choose their pages and print yet.
          </p>
          <Button
            type="button"
            disabled={regenerate.isPending}
            onClick={() => {
              setDialogError(null);
              setDialogOpen(true);
              setDialog({
                mode: "finish",
                pages: [],
                wholeBook: true,
                needsForce: false,
              });
            }}
            className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold h-auto min-h-10 py-2 px-5 shadow-sm whitespace-normal text-left w-full sm:w-auto"
          >
            <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
            Mark ready and email customer
          </Button>
        </div>
      )}

      {result && (
        <div
          role="status"
          className={cn(
            "rounded-xl border p-4 text-sm space-y-2",
            result.queued.length > 0 || result.repaired
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold">{result.message ?? "Done."}</p>
            <button
              type="button"
              onClick={() => setResult(null)}
              aria-label="Dismiss"
              className={cn(
                "shrink-0 p-2 -m-2 rounded-lg",
                result.queued.length > 0 || result.repaired
                  ? "text-emerald-700 hover:text-emerald-900"
                  : "text-amber-700 hover:text-amber-900",
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {result.expanded && (
            <p>
              More pages than the one you chose were restarted together, so the
              customer hears &ldquo;ready&rdquo; only when the book is.
            </p>
          )}
          {result.skipped.length > 0 && (
            <ul className="list-disc pl-5">
              {result.skipped.map((s) => (
                <li key={`${s.pageNumber}-${s.reason}`}>
                  Page {s.pageNumber}: {SKIP_TEXT[s.reason] ?? s.reason}
                  {s.cooldownEndsAt
                    ? ` (can be restarted at ${clock(s.cooldownEndsAt)})`
                    : ""}
                </li>
              ))}
            </ul>
          )}
          {result.queued.length > 0 && (
            <p className="text-xs text-emerald-800">
              The customer&rsquo;s book updates by itself when the pages are
              ready.
            </p>
          )}
        </div>
      )}

      {inProgress && !watchStopped && !error && (
        <p className="text-xs text-neutral-500">
          Pages are being made. Keep this tab open: it keeps the server working
          on them, and it updates by itself.
        </p>
      )}

      {groups.problems.length > 0 && (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Needs attention
        </h3>
      )}
      {groups.problems.length > 0 && (
        <ul className="space-y-2">
          {groups.problems.map((p) => (
            <PageRow
              key={p.pageNumber}
              page={p}
              busy={regenerate.isPending}
              onRestart={(page) => openRestart([page], false)}
            />
          ))}
        </ul>
      )}

      {groups.running.length > 0 && (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Being made
        </h3>
      )}
      {groups.running.length > 0 && (
        <ul className="space-y-2">
          {groups.running.map((p) => (
            <PageRow
              key={p.pageNumber}
              page={p}
              busy={regenerate.isPending}
              onRestart={(page) => openRestart([page], false)}
            />
          ))}
        </ul>
      )}

      {groups.ready.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowReady((v) => !v)}
            aria-expanded={showReady}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#914A8C] hover:underline"
          >
            {showReady ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {showReady ? "Hide" : "Show"} {groups.ready.length} ready page
            {groups.ready.length === 1 ? "" : "s"}
          </button>
          {showReady && (
            <ul className="mt-2 space-y-2">
              {groups.ready.map((p) => (
                <PageRow
                  key={p.pageNumber}
                  page={p}
                  busy={regenerate.isPending}
                  onRestart={(page) => openRestart([page], false)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <RegeneratePagesDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(false);
        }}
        mode={dialog?.mode ?? "restart"}
        pages={dialog?.pages ?? []}
        groupReason={groupReason}
        needsForce={dialog?.needsForce ?? false}
        onConfirm={confirm}
        isPending={regenerate.isPending}
        errorMessage={dialogError}
      />
    </div>
  );
}

/**
 * Pages of a PAID order: which are ready, being made, stuck or failed, and a button to
 * restart them. Shown while the order is PAID or GENERATED (after the customer has sent
 * the book to print its pages are frozen). Renders nothing, and says so in the console, if
 * the backend does not answer.
 */
export function OrderPagesSection({ order }: { order: AdminOrderDetail }) {
  if (order.status !== "PAID" && order.status !== "GENERATED") return null;
  return <PagesBody order={order} />;
}
