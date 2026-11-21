"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LIST_PAGE_SIZE } from "./dataDeletionConfig";

/** Ids only, 25 at a time. They wrap, so the list never widens the page. */
export function IdList({
  title,
  hint,
  ids,
}: {
  title: string;
  hint: string;
  ids: string[];
}) {
  const [shown, setShown] = useState(LIST_PAGE_SIZE);

  return (
    <details className="rounded-2xl border border-[#914A8C]/15 bg-white/60 px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
        {title} ({ids.length})
      </summary>
      <p className="text-xs text-neutral-500 mt-2">{hint}</p>
      {ids.length === 0 ? (
        <p className="text-xs text-neutral-500 mt-2">Nothing in this list.</p>
      ) : (
        <>
          <ul className="mt-2 space-y-1">
            {ids.slice(0, shown).map((id) => (
              <li
                key={id}
                className="font-mono text-xs text-neutral-700 break-all"
              >
                {id}
              </li>
            ))}
          </ul>
          {shown < ids.length ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShown((n) => n + LIST_PAGE_SIZE)}
              className="mt-3 h-9 rounded-xl"
            >
              Show {Math.min(LIST_PAGE_SIZE, ids.length - shown)} more
            </Button>
          ) : null}
        </>
      )}
    </details>
  );
}
