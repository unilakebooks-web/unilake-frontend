"use client";

import { cloneElement, useId, type ReactElement } from "react";

export const card =
  "bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-5 sm:p-6";
export const inputClass = "h-10 rounded-xl bg-white";

/** A labelled field. The label is tied to the input (id) and the hint is read with it (aria-describedby). */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactElement<{ id?: string; "aria-describedby"?: string }>;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-neutral-900">
        {label}
      </label>
      {cloneElement(children, {
        id,
        "aria-describedby": hint ? hintId : undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
