"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * A row of mutually-exclusive options, styled to match the Short/Long preview
 * toggle in the bubble sidebar.
 *
 * Generic over the value so each call site keeps its own union type — passing a
 * TextAlign to the vertical-alignment control is a compile error rather than a
 * 400 at save time.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-neutral-700">{label}</Label>
      <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 text-[11px] px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              value === option.value
                ? "bg-white shadow-sm text-neutral-900 font-medium"
                : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
