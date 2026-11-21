"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/utils";
import type { DeletionAttentionItem } from "@/app/types/dataDeletion";
import {
  useReleaseDeletionItem,
  useRetryDeletionItems,
  useUndoDeletionGhost,
} from "@/hooks/useDataDeletion";
import { ConfirmDialog } from "./ConfirmDialog";
import { LIST_PAGE_SIZE, when } from "./dataDeletionConfig";

type PendingAction = { kind: "release" | "undo"; item: DeletionAttentionItem };

const STATE_CLASS: Record<DeletionAttentionItem["state"], string> = {
  CLAIMED: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-800",
  DONE: "bg-neutral-100 text-neutral-700",
};


/** Items that need a look: stuck, failed, or deleted by a missing object ("ghost"). */
export function AttentionList({ items }: { items: DeletionAttentionItem[] }) {
  const retry = useRetryDeletionItems();
  const release = useReleaseDeletionItem();
  const undo = useUndoDeletionGhost();
  const [shown, setShown] = useState(LIST_PAGE_SIZE);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500">Nothing needs a look.</p>
    );
  }

  const onRetry = async (item: DeletionAttentionItem) => {
    try {
      await retry.mutateAsync({ itemId: item.id });
      toast.success("Put back in the queue");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not retry"));
    }
  };

  const onConfirm = async () => {
    if (!pending) return;
    setActionError(null);
    try {
      if (pending.kind === "release") {
        await release.mutateAsync(pending.item.id);
        toast.success("Released");
      } else {
        const result = await undo.mutateAsync({ itemId: pending.item.id });
        if (result.undone > 0) toast.success("Ghost undone");
        else toast.error(`Not undone: ${result.refused[0]?.reason ?? "refused"}`);
      }
      setPending(null);
    } catch (err: unknown) {
      setActionError(getErrorMessage(err, "Server error"));
    }
  };

  return (
    <>
      <ul className="space-y-3">
        {items.slice(0, shown).map((item) => {
          // Release and undo are not offered for comic and address items (the server refuses them too).
          const clearable = item.scope !== "COMIC" && item.scope !== "ADDRESS";
          return (
            <li
              key={item.id}
              className="rounded-2xl border border-[#914A8C]/15 bg-white/60 p-3 text-xs space-y-1.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${STATE_CLASS[item.state]}`}
                >
                  {item.state}
                </span>
                {item.ghost ? (
                  <span className="rounded-full px-2 py-0.5 font-semibold bg-blue-100 text-blue-800">
                    Ghost
                  </span>
                ) : null}
                <span className="font-semibold text-neutral-900">
                  {item.scope}
                </span>
                <span className="font-mono text-neutral-600 break-all">
                  {item.subjectId}
                </span>
              </div>
              <p className="text-neutral-500">
                Attempts {item.attempts} · claimed {when(item.claimedAt)} ·
                updated {when(item.updatedAt)}
              </p>
              {item.lastError ? (
                <p className="text-red-700 break-words">{item.lastError}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                {item.state === "FAILED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={retry.isPending}
                    onClick={() => onRetry(item)}
                    className="rounded-lg"
                  >
                    Retry
                  </Button>
                ) : null}
                {clearable && item.state !== "DONE" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActionError(null);
                      setPending({ kind: "release", item });
                    }}
                    className="rounded-lg"
                  >
                    Release
                  </Button>
                ) : null}
                {clearable && item.state === "DONE" && item.ghost ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActionError(null);
                      setPending({ kind: "undo", item });
                    }}
                    className="rounded-lg"
                  >
                    Undo ghost
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {shown < items.length ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShown((n) => n + LIST_PAGE_SIZE)}
          className="mt-3 h-9 rounded-xl"
        >
          Show {Math.min(LIST_PAGE_SIZE, items.length - shown)} more
        </Button>
      ) : null}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={pending?.kind === "undo" ? "Undo this ghost?" : "Release this item?"}
        description={
          pending?.kind === "undo"
            ? "The item goes back to being due, so it is checked again. The server refuses it if anything was deleted."
            : "The item is taken out of the queue and the session is due again later. The server refuses it if anything was already deleted."
        }
        confirmLabel={pending?.kind === "undo" ? "Undo ghost" : "Release"}
        pending={release.isPending || undo.isPending}
        error={actionError}
        onConfirm={onConfirm}
      />
    </>
  );
}
