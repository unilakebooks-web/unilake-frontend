"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, OctagonAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/utils";
import type { DeletionGroup, DeletionMode } from "@/app/types/dataDeletion";
import {
  useRetryDeletionItems,
  useUpdateDeletionGroup,
} from "@/hooks/useDataDeletion";
import { Field, card, inputClass } from "../emails/EmailField";
import { ActivateDialog } from "./ActivateDialog";
import { AttentionList } from "./AttentionList";
import { ConfirmDialog } from "./ConfirmDialog";
import { IdList } from "./IdList";
import { ReportFacts } from "./ReportFacts";
import {
  DAILY_MAX_LIMIT,
  DAILY_MAX_MIN,
  GROUP_INFO,
  LIST_INFO,
  MODES,
  MODE_INFO, when } from "./dataDeletionConfig";

const age = (iso: string) => formatDistanceToNow(new Date(iso));

const MODE_PILL: Record<DeletionMode, string> = {
  OFF: "bg-neutral-100 text-neutral-700",
  REPORT_ONLY: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-red-100 text-red-800",
};

/** One group: its mode, its daily maximum, its last report and what needs a look. */
export function GroupCard({ group }: { group: DeletionGroup }) {
  const info = GROUP_INFO[group.group];
  const update = useUpdateDeletionGroup();
  const retry = useRetryDeletionItems();
  const [dailyMax, setDailyMax] = useState(String(group.dailyMax));
  const [seededFrom, setSeededFrom] = useState(group.dailyMax);
  // The server value changed (a save, or someone else): show it. Set during render, so there is no effect.
  if (seededFrom !== group.dailyMax) {
    setSeededFrom(group.dailyMax);
    setDailyMax(String(group.dailyMax));
  }
  const [dailyMaxProblem, setDailyMaxProblem] = useState<string | null>(null);
  // The mode waiting for a confirm (OFF or REPORT_ONLY), and the report the admin reads before ACTIVE.
  const [confirmMode, setConfirmMode] = useState<DeletionMode | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const report = group.report;
  // Frozen when the dialog opens, so a refresh in the background cannot change what is being confirmed.
  const [readReport, setReadReport] = useState(report);

  const onChooseMode = (mode: DeletionMode) => {
    if (mode === group.mode) return;
    setDialogError(null);
    if (mode === "ACTIVE") {
      setReadReport(report);
      setActivateOpen(true);
    } else {
      setConfirmMode(mode);
    }
  };

  const onConfirmMode = async () => {
    if (!confirmMode) return;
    setDialogError(null);
    try {
      await update.mutateAsync({
        group: group.group,
        payload: { mode: confirmMode, expectedModeChangedAt: group.modeChangedAt },
      });
      toast.success(`${info.title}: ${MODE_INFO[confirmMode].label}`);
      setConfirmMode(null);
    } catch (err: unknown) {
      setDialogError(getErrorMessage(err, "Server error"));
    }
  };

  const onActivate = async (confirmation: string) => {
    if (!readReport) return;
    setDialogError(null);
    try {
      await update.mutateAsync({
        group: group.group,
        payload: {
          mode: "ACTIVE",
          expectedModeChangedAt: group.modeChangedAt,
          reportRunId: readReport.id,
          dueCount: readReport.dueCount,
          confirmation,
        },
      });
      toast.success(`${info.title}: deletion is on`);
      setActivateOpen(false);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Server error");
      if (/newer report/i.test(message)) {
        // The page was refetched by the mutation: the card now shows the new report.
        setActivateOpen(false);
        toast.error(`${message} The new report is on the page: read it again.`);
      } else {
        setDialogError(message);
      }
    }
  };

  const onSaveDailyMax = async () => {
    const text = dailyMax.trim();
    const n = /^\d+$/.test(text) ? Number(text) : NaN;
    if (!(n >= DAILY_MAX_MIN && n <= DAILY_MAX_LIMIT)) {
      setDailyMaxProblem(
        `The daily maximum must be a whole number from ${DAILY_MAX_MIN} to ${DAILY_MAX_LIMIT}.`,
      );
      return;
    }
    setDailyMaxProblem(null);
    try {
      await update.mutateAsync({
        group: group.group,
        payload: {
          mode: group.mode,
          dailyMax: n,
          expectedModeChangedAt: group.modeChangedAt,
        },
      });
      toast.success("Daily maximum saved");
    } catch (err: unknown) {
      setDailyMaxProblem(getErrorMessage(err, "Server error"));
    }
  };

  const onRetryAll = async () => {
    try {
      const result = await retry.mutateAsync({ group: group.group });
      toast.success(`${result.retried} put back in the queue`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not retry"));
    }
  };

  return (
    <section className={`${card} space-y-5 min-w-0`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-neutral-900">{info.title}</h2>
          <p className="text-sm text-neutral-600 mt-0.5">{info.summary}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${MODE_PILL[group.mode]}`}
        >
          {MODE_INFO[group.mode].label}
        </span>
      </div>

      {group.pausedReason ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"
        >
          <OctagonAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <p className="break-words min-w-0">
            <strong>Paused: {group.pausedReason}</strong>
            {group.pausedAt ? ` (since ${when(group.pausedAt)})` : ""}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-neutral-900">Mode</p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={group.mode === mode}
              disabled={update.isPending}
              onClick={() => onChooseMode(mode)}
              className={`px-2 py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                group.mode === mode
                  ? "border-[#914A8C] bg-[#914A8C] text-white"
                  : "border-[#914A8C]/25 bg-white text-neutral-700 hover:border-[#914A8C]/60"
              }`}
            >
              {MODE_INFO[mode].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-600">
          {MODE_INFO[group.mode].explanation}
        </p>
        <p className="text-xs text-neutral-500">
          Changed {when(group.modeChangedAt)}
          {group.modeChangedByEmail ? ` by ${group.modeChangedByEmail}` : ""}.
        </p>
        {group.dueNotApproved !== null && group.dueNotApproved > 0 ? (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {group.dueNotApproved} more are due now but were not in the report
            you approved. They wait until the approved ones are finished (or 14
            days have passed).
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Field
          label="Daily maximum"
          hint={`The most items deleted in 24 hours, ${DAILY_MAX_MIN} to ${DAILY_MAX_LIMIT}.`}
        >
          <Input
            inputMode="numeric"
            value={dailyMax}
            onChange={(e) => setDailyMax(e.target.value)}
            className={`${inputClass} w-28`}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSaveDailyMax}
            disabled={update.isPending || dailyMax === String(group.dailyMax)}
            className="h-9 rounded-xl"
          >
            Save
          </Button>
          {dailyMaxProblem ? (
            <p role="alert" className="text-xs text-red-700 break-words min-w-0">
              {dailyMaxProblem}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-neutral-900">Last report</p>
        {report ? (
          <>
            <p className="text-sm text-neutral-700">
              {when(report.startedAt)}: <strong>{report.dueCount}</strong> due
              now.
            </p>
            <ReportFacts report={report} />
            <div className="space-y-2">
              {report.lists ? (
                LIST_INFO.map((entry) => (
                  <IdList
                    key={entry.key}
                    title={entry.title}
                    hint={entry.hint}
                    ids={report.lists?.[entry.key] ?? []}
                  />
                ))
              ) : (
                <p className="text-xs text-neutral-500">
                  The lists of this report are no longer kept.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-neutral-500">
            No report yet. The first one appears within a few hours of the group
            being in Report only mode.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-neutral-900">
            Needs a look ({group.attention.length})
          </p>
          {group.items.failed > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={onRetryAll}
              disabled={retry.isPending}
              className="h-9 rounded-xl"
            >
              {retry.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Retry all failed ({group.items.failed})
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-neutral-500">
          Stuck: {group.items.claimed}
          {group.items.oldestClaimedAt
            ? ` (oldest ${age(group.items.oldestClaimedAt)})`
            : ""}
          . Failed: {group.items.failed}
          {group.items.oldestFailedAt
            ? ` (oldest ${age(group.items.oldestFailedAt)})`
            : ""}
          . Ghosts in the last 24 hours: {group.items.ghostsLast24h} (the group
          pauses at {group.items.ghostPauseMin}).
        </p>
        <AttentionList items={group.attention} />
      </div>

      <ConfirmDialog
        open={confirmMode !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmMode(null);
        }}
        title={`Switch to ${confirmMode ? MODE_INFO[confirmMode].label : ""}?`}
        description={confirmMode ? MODE_INFO[confirmMode].explanation : ""}
        confirmLabel="Yes, switch"
        pending={update.isPending}
        error={dialogError}
        onConfirm={onConfirmMode}
      />
      <ActivateDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title={info.title}
        report={readReport}
        pending={update.isPending}
        error={dialogError}
        onConfirm={onActivate}
      />
    </section>
  );
}
