"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DeletionReport } from "@/app/types/dataDeletion";
import { ReportFacts } from "./ReportFacts";

/**
 * Switching a group to Active. The report shown here is the one the admin reads: the id and the count sent to the
 * server are this report's, so a newer report is refused until it has been read.
 */
export function ActivateDialog({
  open,
  onOpenChange,
  title,
  report,
  pending,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  report: DeletionReport | null;
  pending: boolean;
  error: string | null;
  onConfirm: (confirmation: string) => void;
}) {
  const [typed, setTyped] = useState("");
  const required = report ? `DELETE ${report.dueCount}` : "";
  const matches = report !== null && typed === required;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) setTyped("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Switch on deletion: {title}</DialogTitle>
          <DialogDescription>
            Deleted photos and files cannot be brought back. Read the report
            below, then type the words to confirm.
          </DialogDescription>
        </DialogHeader>

        {report ? (
          <div className="space-y-3 text-sm">
            <p className="text-neutral-700">
              Report of {format(new Date(report.startedAt), "dd MMM yyyy, HH:mm")}
              : <strong>{report.dueCount}</strong> due now.
            </p>
            <ReportFacts report={report} />
            <div className="space-y-1.5">
              <label
                htmlFor="data-deletion-confirm"
                className="text-sm font-semibold text-neutral-900"
              >
                Type <span className="font-mono select-all">{required}</span>
              </label>
              <Input
                id="data-deletion-confirm"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="h-10 rounded-xl bg-white"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-700">
            There is no report yet. Wait for the first report in Report only
            mode.
          </p>
        )}

        {error ? (
          <p
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 break-words"
          >
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setTyped("");
              onOpenChange(false);
            }}
            disabled={pending}
            className="rounded-xl"
          >
            Not yet
          </Button>
          <Button
            onClick={() => onConfirm(typed)}
            disabled={!matches || pending}
            className="rounded-xl bg-red-700 hover:bg-red-800 text-white"
          >
            {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Switch on deletion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
