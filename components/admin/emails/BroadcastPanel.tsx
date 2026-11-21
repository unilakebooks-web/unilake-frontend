"use client";

import { useState } from "react";
import {
  Eye,
  Loader2,
  Mail,
  Plus,
  Save,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/utils";
import { Field, card, inputClass } from "./EmailField";
import {
  BROADCAST_BUTTON_TEXT_MAX,
  BROADCAST_HEADING_MAX,
  BROADCAST_MESSAGE_MAX,
  BROADCAST_SUBJECT_MAX,
} from "./emailConfig";
import {
  useAudienceCounts,
  useBroadcast,
  useBroadcastPreview,
  useBroadcasts,
  useCancelBroadcast,
  useCreateBroadcast,
  useDeleteBroadcast,
  useSendBroadcastTest,
  useStartBroadcast,
  useUpdateBroadcast,
} from "@/hooks/useEmails";
import type {
  Broadcast,
  BroadcastAudience,
  BroadcastPayload,
  BroadcastStatus,
} from "@/app/types/email";

const STATUS_STYLE: Record<BroadcastStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700",
  SENDING: "bg-amber-100 text-amber-800",
  SENT: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};
const STATUS_TEXT: Record<BroadcastStatus, string> = {
  DRAFT: "Draft",
  SENDING: "Sending",
  SENT: "Sent",
  CANCELLED: "Cancelled",
};

interface FormState {
  subject: string;
  heading: string;
  message: string;
  buttonText: string;
  buttonUrl: string;
  audience: BroadcastAudience;
}
const EMPTY: FormState = {
  subject: "",
  heading: "",
  message: "",
  buttonText: "",
  buttonUrl: "",
  audience: "OPTED_IN_ONLY",
};

const fromBroadcast = (b: Broadcast): FormState => ({
  subject: b.subject,
  heading: b.heading,
  message: b.message,
  buttonText: b.buttonText ?? "",
  buttonUrl: b.buttonUrl ?? "",
  audience: b.audience,
});

function toPayload(f: FormState): BroadcastPayload {
  return {
    subject: f.subject.trim(),
    heading: f.heading.trim(),
    message: f.message.trim(),
    buttonText: f.buttonText.trim() === "" ? null : f.buttonText.trim(),
    buttonUrl: f.buttonUrl.trim() === "" ? null : f.buttonUrl.trim(),
    audience: f.audience,
  };
}

/** Mirrors the server rules (validators/broadcast.schema.ts); the server checks again. */
function problemsOf(f: FormState): string[] {
  const p: string[] = [];
  if (f.subject.trim() === "") p.push("Add a subject.");
  if (/[\r\n]/.test(f.subject) || /[\r\n]/.test(f.heading))
    p.push("Subject and heading must be one line.");
  if (f.heading.trim() === "") p.push("Add a heading.");
  if (f.message.trim() === "") p.push("Write the message.");
  if (f.message.length > BROADCAST_MESSAGE_MAX)
    p.push(
      `The message is too long (${BROADCAST_MESSAGE_MAX} characters at most).`,
    );
  const hasText = f.buttonText.trim() !== "";
  const hasUrl = f.buttonUrl.trim() !== "";
  if (hasText !== hasUrl)
    p.push("Give both the button text and the button link, or neither.");
  if (hasUrl) {
    try {
      const u = new URL(f.buttonUrl.trim());
      if (u.protocol !== "https:" || u.username || u.password)
        p.push("The button link must be a plain https:// link.");
    } catch {
      p.push("The button link must be a valid https:// link.");
    }
  }
  return p;
}

function BroadcastEditor({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const detail = useBroadcast(id);
  const counts = useAudienceCounts();
  const create = useCreateBroadcast();
  const update = useUpdateBroadcast();
  const remove = useDeleteBroadcast();
  const test = useSendBroadcastTest();
  const start = useStartBroadcast();
  const cancel = useCancelBroadcast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [seededFor, setSeededFor] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shown, setShown] = useState<string[]>([]);
  const preview = useBroadcastPreview(id, showPreview);

  // Seed the form once the saved broadcast arrives (set during render, not in an effect, so there is no flash).
  const saved = detail.data;
  if (saved && seededFor !== saved.id) {
    setSeededFor(saved.id);
    setForm(fromBroadcast(saved));
  }

  if (id !== null && detail.isLoading)
    return <Skeleton className="h-64 w-full rounded-3xl bg-[#F8E7D2]/60" />;
  // A saved broadcast that did not load must not show an empty form that could be saved over it.
  if (id !== null && !saved) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">
          {getErrorMessage(detail.error, "Failed to load this broadcast")}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => detail.refetch()}
            className="rounded-xl"
          >
            Try again
          </Button>
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  const status: BroadcastStatus = saved?.status ?? "DRAFT";
  const editable = status === "DRAFT";
  const dirty = saved
    ? JSON.stringify(toPayload(form)) !==
      JSON.stringify(toPayload(fromBroadcast(saved)))
    : true;
  const audienceCount =
    form.audience === "OPTED_IN_ONLY"
      ? counts.data?.optedInOnly
      : counts.data?.optedInAndCustomers;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSave = async () => {
    const found = problemsOf(form);
    setShown(found);
    if (found.length > 0) return;
    try {
      if (id === null) {
        await create.mutateAsync(toPayload(form));
        toast.success("Draft saved");
        onClose();
      } else {
        await update.mutateAsync({ id, payload: toPayload(form) });
        toast.success("Draft saved");
      }
    } catch (err: unknown) {
      toast.error("Failed to save: " + getErrorMessage(err, "Server error"));
    }
  };

  const onTest = async () => {
    if (id === null) return;
    try {
      const result = await test.mutateAsync(id);
      if (result.sent) toast.success("Test sent to your own login email.");
      else toast.error(result.reason);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not send the test."));
    }
  };

  const onSend = async () => {
    if (id === null || audienceCount === undefined) return;
    try {
      await start.mutateAsync({ id, count: audienceCount });
      setConfirmOpen(false);
      toast.success(
        "Sending started. It goes out in small batches during sending hours.",
      );
    } catch (err: unknown) {
      setConfirmOpen(false);
      toast.error(getErrorMessage(err, "Could not start sending."));
    }
  };

  const onCancel = async () => {
    if (id === null) return;
    try {
      await cancel.mutateAsync(id);
      toast.success("Broadcast cancelled. Nothing more will be sent.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not cancel."));
    }
  };

  const onDelete = async () => {
    if (id === null) return;
    if (!window.confirm("Delete this draft? This cannot be undone.")) return;
    try {
      await remove.mutateAsync(id);
      toast.success("Draft deleted");
      onClose();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not delete."));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900">
          {id === null ? "New broadcast" : "Broadcast"}
        </h2>
        <div className="flex items-center gap-2">
          {saved ? (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[status]}`}
            >
              {STATUS_TEXT[status]}
            </span>
          ) : null}
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Back to list
          </Button>
        </div>
      </div>

      <section className={card}>
        <fieldset disabled={!editable} className="space-y-4 min-w-0">
          <Field label="Subject" hint="One line. Shown in the inbox.">
            <Input
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className={inputClass}
              maxLength={BROADCAST_SUBJECT_MAX}
            />
          </Field>
          <Field label="Heading" hint="Large text at the top of the email.">
            <Input
              value={form.heading}
              onChange={(e) => set("heading", e.target.value)}
              className={inputClass}
              maxLength={BROADCAST_HEADING_MAX}
            />
          </Field>
          <Field
            label="Message"
            hint="Plain text. A blank line starts a new paragraph."
          >
            <Textarea
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              rows={8}
              className="rounded-xl bg-white"
              maxLength={BROADCAST_MESSAGE_MAX}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Button text (optional)">
              <Input
                value={form.buttonText}
                onChange={(e) => set("buttonText", e.target.value)}
                className={inputClass}
                maxLength={BROADCAST_BUTTON_TEXT_MAX}
              />
            </Field>
            <Field label="Button link (optional)" hint="A plain https:// link.">
              <Input
                value={form.buttonUrl}
                onChange={(e) => set("buttonUrl", e.target.value)}
                className={inputClass}
                placeholder="https://…"
              />
            </Field>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-neutral-900">
              Who gets it
            </legend>
            {(
              [
                [
                  "OPTED_IN_ONLY",
                  "Only people who ticked “send me offers and news”",
                  counts.data?.optedInOnly,
                ],
                [
                  "OPTED_IN_AND_CUSTOMERS",
                  "Those people, plus everyone who has bought a book",
                  counts.data?.optedInAndCustomers,
                ],
              ] as const
            ).map(([value, label, count]) => (
              <label
                key={value}
                className="flex items-start gap-2 text-sm text-neutral-800 cursor-pointer"
              >
                <input
                  type="radio"
                  name="audience"
                  checked={form.audience === value}
                  onChange={() => set("audience", value)}
                  className="mt-1 accent-[#914A8C]"
                />
                <span>
                  {label} <strong>({count ?? "…"})</strong>
                </span>
              </label>
            ))}
            <p className="text-xs text-neutral-500">
              People who unsubscribed and staff accounts are always left out.
              Everyone gets an unsubscribe link.
            </p>
          </fieldset>
        </fieldset>
      </section>

      {shown.length > 0 ? (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 space-y-1"
        >
          {shown.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      ) : null}

      {saved && status !== "DRAFT" ? (
        <section className={card}>
          <h3 className="font-bold text-neutral-900">Progress</h3>
          <p className="text-sm text-neutral-700 mt-1">
            {saved.sentCount} sent, {saved.failedCount} refused,{" "}
            {saved.progress.pending} waiting, out of {saved.recipientCount} at
            the start.
            {saved.recipientCount >
            saved.sentCount + saved.failedCount + saved.progress.pending
              ? " The rest unsubscribed since, or are still being sent."
              : ""}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Created by {saved.createdByEmail}
            {saved.sendStartedAt
              ? `, started ${new Date(saved.sendStartedAt).toLocaleString()}`
              : ""}
            {saved.finishedAt
              ? `, finished ${new Date(saved.finishedAt).toLocaleString()}`
              : ""}
            .
          </p>
          {status === "SENDING" ? (
            <Button
              onClick={onCancel}
              disabled={cancel.isPending}
              variant="outline"
              className="mt-3 rounded-xl text-red-700 border-red-200"
            >
              {cancel.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Cancel sending
            </Button>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {editable ? (
          <Button
            onClick={onSave}
            disabled={!dirty || create.isPending || update.isPending}
            className="rounded-xl h-10 bg-[#914A8C] hover:bg-[#7d3f79] text-white"
          >
            {create.isPending || update.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save draft
          </Button>
        ) : null}
        {id !== null ? (
          <Button
            variant="outline"
            onClick={() => setShowPreview((v) => !v)}
            disabled={dirty && editable}
            className="rounded-xl h-10"
          >
            <Eye className="w-4 h-4 mr-2" />{" "}
            {showPreview ? "Hide preview" : "Preview"}
          </Button>
        ) : null}
        {editable && id !== null ? (
          <>
            <Button
              variant="outline"
              onClick={onTest}
              disabled={dirty || test.isPending}
              className="rounded-xl h-10"
            >
              {test.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send test to me
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={dirty || !audienceCount}
              className="rounded-xl h-10 bg-green-700 hover:bg-green-800 text-white"
            >
              <Send className="w-4 h-4 mr-2" /> Send…
            </Button>
            <Button
              variant="ghost"
              onClick={onDelete}
              disabled={remove.isPending}
              className="rounded-xl h-10 text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete draft
            </Button>
          </>
        ) : null}
      </div>
      {editable && dirty && id !== null ? (
        <p className="text-xs text-neutral-500">
          Save the draft before previewing, testing or sending.
        </p>
      ) : null}
      {editable && id !== null && audienceCount === 0 ? (
        <p className="text-xs text-neutral-500">
          Nobody is in this audience yet, so there is nothing to send.
        </p>
      ) : null}

      {showPreview ? (
        <section className={card}>
          <h3 className="font-bold text-neutral-900 mb-2">Preview</h3>
          {preview.isLoading ? (
            <Skeleton className="h-64 w-full bg-[#F8E7D2]/60" />
          ) : preview.data ? (
            <>
              <p className="text-sm text-neutral-700 mb-2">
                Subject: <strong>{preview.data.subject}</strong>
              </p>
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={preview.data.html}
                className="w-full h-[520px] rounded-xl border border-neutral-200 bg-white"
              />
              <p className="text-xs text-neutral-500 mt-2">
                In a real send the footer link is personal to each person.
              </p>
            </>
          ) : (
            <p className="text-sm text-red-600">Could not load the preview.</p>
          )}
        </section>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send this broadcast?</DialogTitle>
            <DialogDescription>
              It will go to {audienceCount ?? "…"}{" "}
              {audienceCount === 1 ? "person" : "people"}
              {form.audience === "OPTED_IN_ONLY"
                ? " who ticked the offers box"
                : ", including customers who did not tick the box"}
              . It goes out in small batches during sending hours and shares the
              daily budget with reminders.{" "}
              {counts.data && counts.data.dailyCapacity === 0
                ? "At the current budget there is no room for broadcasts: raise the daily budget on the Reminders tab."
                : `At the current limits (${counts.data?.dailyCapacity ?? "…"} a day) that is about ${
                    counts.data && audienceCount
                      ? Math.max(
                          1,
                          Math.ceil(audienceCount / counts.data.dailyCapacity),
                        )
                      : "…"
                  } day(s).`}{" "}
              You can cancel while it is sending, but emails already sent cannot
              be taken back.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              className="rounded-xl"
            >
              Not yet
            </Button>
            <Button
              onClick={onSend}
              disabled={start.isPending}
              className="rounded-xl bg-green-700 hover:bg-green-800 text-white"
            >
              {start.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Yes, send to {audienceCount ?? "…"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BroadcastPanel() {
  const list = useBroadcasts();
  // null = the list; "new" = a blank editor; anything else = a saved broadcast.
  const [open, setOpen] = useState<string | null>(null);

  if (open !== null) {
    return (
      <BroadcastEditor
        key={open}
        id={open === "new" ? null : open}
        onClose={() => setOpen(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">
          Write one email and send it to people who chose to hear from you.
          Reminders always go first.
        </p>
        <Button
          onClick={() => setOpen("new")}
          className="rounded-xl h-10 bg-[#914A8C] hover:bg-[#7d3f79] text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" /> New broadcast
        </Button>
      </div>

      {list.isLoading ? (
        <Skeleton className="h-32 w-full rounded-3xl bg-[#F8E7D2]/60" />
      ) : list.isError ? (
        <p className="text-sm text-red-600">
          {getErrorMessage(list.error, "Failed to load broadcasts")}
        </p>
      ) : list.data && list.data.length > 0 ? (
        <ul className="space-y-2">
          {list.data.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setOpen(b.id)}
                className={`${card} w-full text-left hover:border-[#914A8C]/40 transition-colors`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-neutral-900 truncate">
                    {b.subject}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[b.status]}`}
                  >
                    {STATUS_TEXT[b.status]}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {b.status === "DRAFT"
                    ? "Not sent yet"
                    : `${b.sentCount} sent of ${b.recipientCount}`}{" "}
                  · {b.createdByEmail} ·{" "}
                  {new Date(b.createdAt).toLocaleDateString()}
                </p>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">No broadcasts yet.</p>
      )}
    </div>
  );
}
