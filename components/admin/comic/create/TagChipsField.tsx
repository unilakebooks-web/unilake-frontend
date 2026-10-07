"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagChipOption {
  value: string;
  label: string;
}

interface TagChipsFieldProps {
  options: TagChipOption[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Labels the chip group for screen readers, e.g. "Gender". */
  ariaLabel: string;
  disabled?: boolean;
}

/**
 * Multi-select as a row of toggle pills — used for a comic's genders, age
 * groups and themes. Every option is visible at once, and the row wraps, so it
 * works the same for 3 genders as for a long theme list.
 *
 * The emitted list keeps the order of `options`, not the order of clicks, so a
 * form's value is stable however the admin ticks things.
 */
export function TagChipsField({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
}: TagChipsFieldProps) {
  const toggle = (optionValue: string) => {
    const nextSet = new Set(value);
    if (nextSet.has(optionValue)) {
      nextSet.delete(optionValue);
    } else {
      nextSet.add(optionValue);
    }
    onChange(options.map((o) => o.value).filter((v) => nextSet.has(v)));
  };

  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => toggle(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#914A8C]/40",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isSelected
                ? "bg-[#914A8C] border-[#914A8C] text-white"
                : "bg-white border-neutral-200 text-neutral-700 hover:border-[#914A8C]/50 hover:bg-[#914A8C]/5 cursor-pointer"
            )}
          >
            {isSelected && <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
