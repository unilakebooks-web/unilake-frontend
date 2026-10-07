"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Lightbulb,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  useComicFacts,
  useCreateComicFact,
  useUpdateComicFact,
  useToggleComicFactStatus,
  useDeleteComicFact,
} from "@/hooks/useComicFacts";
import { ComicFactModal } from "./ComicFactModal";
import { ComicFactDeleteDialog } from "./ComicFactDeleteDialog";
import type {
  AdminComicFact,
  ComicDetail,
  ComicFactPlacement,
} from "@/app/types/comic";

interface ComicFactsManagerProps {
  comic: ComicDetail;
}

const LISTS: {
  value: ComicFactPlacement;
  label: string;
  blurb: string;
}[] = [
  {
    value: "PRELOADER",
    label: "Loading screen",
    blurb:
      "Shown on the full-screen loader right after a customer submits their photo. It runs for about 55 seconds and shows each fact for 5, so about 11 facts keeps it from repeating.",
  },
  {
    value: "GENERATING",
    label: "Generating pages",
    blurb:
      "Shown inside each page while its artwork is being generated. Every page on screen shows the same fact at the same time.",
  },
];

function errorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return "Something went wrong";
}

export function ComicFactsManager({ comic }: ComicFactsManagerProps) {
  const [activeList, setActiveList] = useState<ComicFactPlacement>("PRELOADER");

  const { data: facts = [], isLoading, isError, error, refetch } =
    useComicFacts(comic.id);

  const createFact = useCreateComicFact(comic.id);
  const updateFact = useUpdateComicFact(comic.id);
  const toggleFact = useToggleComicFactStatus(comic.id);
  const removeFact = useDeleteComicFact(comic.id);

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    fact: AdminComicFact | null;
  }>({ open: false, mode: "create", fact: null });

  const [deleteTarget, setDeleteTarget] = useState<AdminComicFact | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Both lists arrive in one request; the tabs just filter what is already here,
  // so switching between them costs nothing.
  const visibleFacts = useMemo(
    () => facts.filter((f) => f.placement === activeList),
    [facts, activeList]
  );

  const activeCount = visibleFacts.filter((f) => f.isActive).length;
  const currentList = LISTS.find((l) => l.value === activeList)!;

  const handleSave = async (text: string) => {
    if (modalState.mode === "create") {
      await createFact.mutateAsync({ placement: activeList, text });
      toast.success("Fact added");
    } else if (modalState.fact) {
      await updateFact.mutateAsync({
        factId: modalState.fact.id,
        payload: { text },
      });
      toast.success("Fact updated");
    }
  };

  const handleToggle = async (fact: AdminComicFact) => {
    setTogglingId(fact.id);
    try {
      await toggleFact.mutateAsync(fact.id);
      toast.success(fact.isActive ? "Fact hidden" : "Fact is now live");
    } catch (err: unknown) {
      toast.error(errorMessage(err));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeFact.mutateAsync(id);
      toast.success("Fact deleted");
    } catch (err: unknown) {
      toast.error(errorMessage(err));
      throw err; // keeps the dialog open so the admin sees it failed
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#914A8C]" />
            Facts
          </h2>
          {/* <p className="text-sm text-neutral-500 mt-0.5 max-w-2xl">
            Short lines that rotate every few seconds while this comic is being
            made, so the customer has something to read instead of a bare loading
            bar. Entirely optional — a comic with no facts works exactly as
            before.
          </p> */}
        </div>

        <button
          type="button"
          onClick={() => setModalState({ open: true, mode: "create", fact: null })}
          className="inline-flex items-center gap-2 rounded-xl bg-[#914A8C] px-5 h-11 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#7a3e75] shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add fact
        </button>
      </div>

      {/* Which of the two lists is being edited */}
      <div className="flex gap-1 p-1 bg-neutral-100/70 rounded-2xl mb-6 w-full sm:w-fit">
        {LISTS.map((list) => {
          const count = facts.filter((f) => f.placement === list.value).length;
          const isActive = activeList === list.value;
          return (
            <button
              key={list.value}
              type="button"
              onClick={() => setActiveList(list.value)}
              className={cn(
                "flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                isActive
                  ? "bg-white text-[#914A8C] shadow-sm"
                  : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              {list.label}
              <span
                className={cn(
                  "ml-2 text-xs font-bold",
                  isActive ? "text-[#914A8C]/70" : "text-neutral-400"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-xl p-3 mb-6">
        {currentList.blurb}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl bg-[#F8E7D2]/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load facts</h3>
          <p className="text-sm text-red-600 mb-5">{errorMessage(error)}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : visibleFacts.length === 0 ? (
        <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-10 text-center">
          <div className="w-10 h-10 rounded-full bg-[#F8E7D2] flex items-center justify-center text-[#914A8C] mx-auto mb-3">
            <Lightbulb className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-neutral-900">
            No facts for this screen yet
          </p>
          <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
            Customers will see the default UniLake line instead. Add a few to
            make the wait feel shorter.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visibleFacts.map((fact) => (
              <div
                key={fact.id}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border p-4 transition-colors",
                  fact.isActive
                    ? "bg-white border-neutral-200"
                    : "bg-neutral-50 border-neutral-200"
                )}
              >
                <p
                  className={cn(
                    "flex-1 text-sm leading-relaxed",
                    fact.isActive ? "text-neutral-800" : "text-neutral-400 line-through"
                  )}
                >
                  {fact.text}
                </p>

                <div className="flex items-center gap-2 shrink-0">
                  {togglingId === fact.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                  ) : (
                    <Switch
                      checked={fact.isActive}
                      onCheckedChange={() => handleToggle(fact)}
                      aria-label={fact.isActive ? "Hide this fact" : "Show this fact"}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setModalState({ open: true, mode: "edit", fact })
                    }
                    className="p-2 rounded-lg text-neutral-500 hover:text-[#914A8C] hover:bg-neutral-100 transition-colors"
                    aria-label="Edit fact"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(fact)}
                    className="p-2 rounded-lg text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Delete fact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-neutral-500 mt-4">
            {activeCount} of {visibleFacts.length} live. Facts appear in a random
            order, so customers see a different sequence each time.
          </p>
        </>
      )}

      <ComicFactModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((s) => ({ ...s, open }))}
        mode={modalState.mode}
        placement={activeList}
        initialText={modalState.fact?.text ?? ""}
        onSave={handleSave}
      />

      <ComicFactDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        fact={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
