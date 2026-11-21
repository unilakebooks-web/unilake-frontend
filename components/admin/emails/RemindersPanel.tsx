"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Plus, RefreshCw, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";
import type { ReminderSettings } from "@/app/types/email";
import {
  useReminderSettings,
  useReminderStatus,
  useSaveReminderSettings,
} from "@/hooks/useEmails";
import {
  KIND_SHORT,
  MAX_REMINDER_OFFSETS,
  REMINDER_KIND_INFO,
  STATUS_LABELS,
  hoursLabel,
  toFormValues,
  toReminderPayload,
  validateReminderForm,
  type ReminderFormValues,
} from "./emailConfig";
import { Field, card, inputClass } from "./EmailField";

export function RemindersPanel() {
  const settings = useReminderSettings();
  const status = useReminderStatus();
  const save = useSaveReminderSettings();
  const [values, setValues] = useState<ReminderFormValues | null>(null);
  const [problems, setProblems] = useState<string[]>([]);

  // The query resolves after the first render: seed the form once it lands, and again after a save
  // (set during render, keyed on the data object, so there is no effect and no flash).
  const [seededFrom, setSeededFrom] = useState<ReminderSettings | null>(null);
  if (settings.data && seededFrom !== settings.data) {
    setSeededFrom(settings.data);
    setValues(toFormValues(settings.data));
  }

  if (settings.isError && !settings.data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h3 className="font-bold text-lg mb-1">
          Failed to load the reminder settings
        </h3>
        <p className="text-sm text-red-600 mb-5">
          {getErrorMessage(settings.error, "Unknown error")}
        </p>
        <Button
          onClick={() => settings.refetch()}
          className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Try again
        </Button>
      </div>
    );
  }

  if (settings.isLoading || !values) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={card}>
            <Skeleton className="h-6 w-48 bg-[#F8E7D2]/80" />
            <Skeleton className="h-10 w-full mt-4 bg-[#F8E7D2]/60" />
          </div>
        ))}
      </div>
    );
  }

  const set = <K extends keyof ReminderFormValues>(
    key: K,
    value: ReminderFormValues[K],
  ) => setValues((v) => (v ? { ...v, [key]: value } : v));

  const dirty =
    seededFrom !== null &&
    JSON.stringify(values) !== JSON.stringify(toFormValues(seededFrom));

  // Mirrors the server: a reminder that is on starts afresh when it is switched on, or when its times or the
  // sending hours change, so reminders already due and not yet sent are dropped.
  const before = seededFrom ? toFormValues(seededFrom) : null;
  const windowChanged =
    before !== null &&
    (values.windowStartHour.trim() !== before.windowStartHour ||
      values.windowEndHour.trim() !== before.windowEndHour);
  const resetsSchedule =
    before !== null &&
    REMINDER_KIND_INFO.some(
      (info) =>
        values[info.enabledKey] &&
        (!before[info.enabledKey] ||
          windowChanged ||
          values[info.offsetsKey].map((h) => h.trim()).join(",") !==
            before[info.offsetsKey].join(","))
    );

  const onSave = async () => {
    const found = validateReminderForm(values);
    setProblems(found);
    if (found.length > 0) return;
    try {
      await save.mutateAsync(toReminderPayload(values));
      toast.success("Reminder settings saved");
    } catch (err: unknown) {
      toast.error("Failed to save: " + getErrorMessage(err, "Server error"));
    }
  };

  const budget = status.data?.budget;

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="text-lg font-bold text-neutral-900">Today</h2>
        {budget ? (
          <p className="text-sm text-neutral-700 mt-1">
            {budget.remindersToday + budget.broadcastToday} of {budget.daily}{" "}
            emails used today ({budget.remindersToday} reminders,{" "}
            {budget.broadcastToday} broadcast). Order emails are not counted.
          </p>
        ) : status.isError ? (
          <p className="text-sm text-red-600 mt-1">
            Could not load today&apos;s use.{" "}
            <button
              type="button"
              onClick={() => status.refetch()}
              className="underline"
            >
              Try again
            </button>
          </p>
        ) : (
          <p className="text-sm text-neutral-500 mt-1">
            Loading today&apos;s use…
          </p>
        )}
        {status.data && status.data.today.length > 0 ? (
          <ul className="mt-2 text-xs text-neutral-600 space-y-0.5">
            {status.data.today.map((row) => (
              <li key={`${row.kind}-${row.status}`}>
                {KIND_SHORT[row.kind]}: {row.count}{" "}
                {(STATUS_LABELS[row.status] ?? row.status).toLowerCase()}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-xs text-neutral-500 mt-2">
          The site&apos;s email plan allows a fixed number of emails a day for
          everything, including order emails. Keep the daily budget below that
          limit.
        </p>
      </section>

      {status.data ? (
        <section className={card}>
          <h2 className="text-lg font-bold text-neutral-900">
            Last {status.data.recent.days} days
          </h2>
          <ul className="mt-1 text-sm text-neutral-700 space-y-0.5">
            <li>
              {status.data.recent.sentPreviewReminders} unfinished-preview
              reminders sent
            </li>
            <li>
              {status.data.recent.boughtAfterReminder} of those customers then
              bought (the order was started after the reminder; this does not
              prove the reminder caused it)
            </li>
            <li>
              {status.data.recent.refused} reminders refused by the email
              service
            </li>
            <li>
              {status.data.recent.optedOutTotal} addresses have unsubscribed in
              all
            </li>
          </ul>
        </section>
      ) : null}

      <p className="text-sm text-neutral-600 px-1">
        Switching a reminder on, or changing its times or the sending hours,
        starts from that moment: nobody is sent a reminder for something that
        was already overdue.
      </p>

      {REMINDER_KIND_INFO.map((info) => {
        const offsets = values[info.offsetsKey];
        const due = status.data?.dueNow[info.kind];
        return (
          <section key={info.kind} className={card}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-neutral-900">
                  {info.title}
                </h2>
                <p className="text-sm text-neutral-600 mt-0.5">
                  {info.summary}
                </p>
              </div>
              <label className="flex items-center gap-2 shrink-0 text-sm font-semibold text-neutral-800">
                <Switch
                  checked={values[info.enabledKey]}
                  onCheckedChange={(on) => set(info.enabledKey, on)}
                  aria-label={`${info.title} reminder on or off`}
                />
                {values[info.enabledKey] ? "On" : "Off"}
              </label>
            </div>

            <div className="mt-4 space-y-1.5">
              <span className="text-sm font-semibold text-neutral-900">
                Send times, in hours {info.countedFrom}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {offsets.map((hours, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Input
                      inputMode="numeric"
                      value={hours}
                      aria-label={`${info.title} send time ${i + 1}`}
                      onChange={(e) =>
                        set(
                          info.offsetsKey,
                          offsets.map((h, j) => (j === i ? e.target.value : h)),
                        )
                      }
                      className={`${inputClass} w-20`}
                    />
                    <span className="text-xs text-neutral-500 w-16">
                      {hoursLabel(hours)}
                    </span>
                    {offsets.length > 1 ? (
                      <button
                        type="button"
                        aria-label={`Remove send time ${i + 1}`}
                        onClick={() =>
                          set(
                            info.offsetsKey,
                            offsets.filter((_, j) => j !== i),
                          )
                        }
                        className="text-neutral-400 hover:text-neutral-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
                {offsets.length < MAX_REMINDER_OFFSETS ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => set(info.offsetsKey, [...offsets, ""])}
                    className="h-10 rounded-xl"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-neutral-500">
                Up to {MAX_REMINDER_OFFSETS}, each later than the one before, at
                most {info.maxHours} hours.
                {typeof due === "number"
                  ? ` Waiting to go out now: ${due}.`
                  : ""}
              </p>
            </div>

            {info.kind === "PREVIEW_UNFINISHED" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Coupon code in the last reminder (optional)"
                  hint="Shown only in the last reminder, and only while the code is valid and open to everyone."
                >
                  <Input
                    value={values.reminderCouponCode}
                    onChange={(e) => set("reminderCouponCode", e.target.value)}
                    className={inputClass}
                    placeholder="e.g. WELCOME-10"
                  />
                </Field>
              </div>
            ) : null}

            {info.kind === "REVIEW_REQUEST" ? (
              <div className="mt-4">
                <Field
                  label="Google review link"
                  hint="The 'write a review' link from your Google Business Profile. Must be an https Google link."
                >
                  <Input
                    value={values.googleReviewUrl}
                    onChange={(e) => set("googleReviewUrl", e.target.value)}
                    className={inputClass}
                    placeholder="https://g.page/r/…/review"
                  />
                </Field>
              </div>
            ) : null}
          </section>
        );
      })}

      <section className={card}>
        <h2 className="text-lg font-bold text-neutral-900">Limits and hours</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Daily budget"
            hint="Reminders and broadcast emails together, per day (India time)."
          >
            <Input
              inputMode="numeric"
              value={values.dailyBudget}
              onChange={(e) => set("dailyBudget", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Kept for reminders"
            hint="A broadcast never uses this part of the budget, so a due reminder always has room."
          >
            <Input
              inputMode="numeric"
              value={values.reminderReserve}
              onChange={(e) => set("reminderReserve", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Most per run"
            hint="Emails sent at most per check, every 5 minutes."
          >
            <Input
              inputMode="numeric"
              value={values.perRunLimit}
              onChange={(e) => set("perRunLimit", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Sending starts (hour, India time)"
            hint="0 to 23. Nothing is sent before this hour."
          >
            <Input
              inputMode="numeric"
              value={values.windowStartHour}
              onChange={(e) => set("windowStartHour", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Sending ends (hour, India time)"
            hint="1 to 24. Nothing is sent from this hour on."
          >
            <Input
              inputMode="numeric"
              value={values.windowEndHour}
              onChange={(e) => set("windowEndHour", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      {problems.length > 0 ? (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 space-y-1"
        >
          {problems.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      ) : null}

      {dirty && resetsSchedule ? (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800"
        >
          Saving will restart the schedule of the reminders you switched on or
          changed: anything already due but not yet sent is skipped, and only
          send times that come after you save are used.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          onClick={onSave}
          disabled={!dirty || save.isPending}
          className="rounded-xl h-11 px-6 bg-[#914A8C] hover:bg-[#7d3f79] text-white"
        >
          {save.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save changes
        </Button>
      </div>
    </div>
  );
}
