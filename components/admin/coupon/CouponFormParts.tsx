"use client";

import type { ReactNode } from "react";

export const labelClass = "block text-xs font-bold uppercase tracking-wide text-[#914A8C] mb-1.5";
export const selectClass =
  "h-10 w-full rounded-lg border border-input bg-white px-3 text-sm font-medium focus:outline-none focus:border-[#914A8C]";

/** A titled group of related fields inside the coupon form. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#914A8C]/15 bg-[#F8E7D2]/20 p-4 space-y-4">
      <h3 className="text-sm font-black uppercase tracking-wide text-[#914A8C]">{title}</h3>
      {children}
    </section>
  );
}

interface ScopePickerProps {
  label: string;
  allText: string;
  selectedText: string;
  /** True when the coupon is not limited on this dimension. */
  all: boolean;
  onAllChange: (all: boolean) => void;
  options: { value: string; label: string }[];
  selected: string[];
  onSelectedChange: (values: string[]) => void;
}

/**
 * "All" or "Selected" choice, with the options as tappable chips when Selected.
 * Replaces a row of checkboxes where "nothing ticked" secretly meant "everything".
 */
export function ScopePicker({
  label,
  allText,
  selectedText,
  all,
  onAllChange,
  options,
  selected,
  onSelectedChange,
}: ScopePickerProps) {
  const toggle = (value: string) =>
    onSelectedChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  const segment = (active: boolean) =>
    `px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
      active ? "bg-[#914A8C] text-white" : "text-[#914A8C] hover:bg-[#914A8C]/10"
    }`;

  return (
    <div>
      <span className={labelClass}>{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex gap-1 rounded-full border border-[#914A8C]/25 bg-white p-0.5">
        <button type="button" role="radio" aria-checked={all} className={segment(all)} onClick={() => onAllChange(true)}>
          {allText}
        </button>
        <button type="button" role="radio" aria-checked={!all} className={segment(!all)} onClick={() => onAllChange(false)}>
          {selectedText}
        </button>
      </div>
      {!all && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {options.map((option) => {
              const on = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(option.value)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                    on
                      ? "bg-[#914A8C]/10 border-[#914A8C] text-[#914A8C]"
                      : "bg-white border-neutral-300 text-neutral-600 hover:border-[#914A8C]/50"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {option.label}
                </button>
              );
            })}
          </div>
          {selected.length === 0 && (
            <p className="text-xs font-medium text-amber-700 mt-2">Pick at least one, or switch back to All.</p>
          )}
        </div>
      )}
    </div>
  );
}
