"use client";
import { when } from "./dataDeletionConfig";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/utils";
import type { DeletionOverview } from "@/app/types/dataDeletion";
import { useRunStorageCheck } from "@/hooks/useDataDeletion";
import { card } from "../emails/EmailField";


/** The storage check (canary): a test object is written, listed and deleted in each bucket. */
export function CanaryCard({ canary }: { canary: DeletionOverview["canary"] }) {
  const run = useRunStorageCheck();

  const onRun = async () => {
    try {
      const result = await run.mutateAsync();
      if (!result.ran) toast.warning("The check did not run. Try again in a few minutes.");
      else if (result.passed) toast.success("Storage check passed");
      else toast.error("Storage check failed");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not run the storage check"));
    }
  };

  return (
    <section className={card}>
      <h2 className="text-lg font-bold text-neutral-900">Storage check</h2>
      <p className="text-sm text-neutral-700 mt-1">
        {canary.passedAt
          ? `Last passed ${when(canary.passedAt)}.`
          : "It has not passed yet."}
      </p>
      {canary.attemptedAt ? (
        <p className="text-xs text-neutral-500 mt-0.5">
          Last tried {when(canary.attemptedAt)}.
        </p>
      ) : null}
      <p className="text-xs text-neutral-500 mt-2">
        It must have passed in the last {canary.validHours} hours: a group
        cannot be switched on, and an Active group stops, until it has.{" "}
        {canary.autoEnabled
          ? "It now also runs by itself once a day."
          : "Once it has passed by hand, it runs by itself once a day."}
      </p>
      <Button
        type="button"
        onClick={onRun}
        disabled={run.isPending}
        className="mt-3 rounded-xl h-10 bg-[#914A8C] hover:bg-[#7d3f79] text-white"
      >
        {run.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Run storage check
      </Button>
    </section>
  );
}
