"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MultiSelectFilterOption {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  /** Shown when nothing is selected, e.g. "Gender". */
  label: string;
  options: MultiSelectFilterOption[];
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}

/**
 * Admin list filter that accepts several values — a comic matches if it has
 * ANY of them. Ticking an item keeps the menu open (Base UI checkbox items do
 * not close on click), so several can be picked in one go.
 *
 * Trigger text: the label when empty, the one value's name when one is
 * picked, "Label (n)" for more.
 */
export function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  className,
}: MultiSelectFilterProps) {
  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  const triggerText =
    selectedLabels.length === 0
      ? label
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${label} (${selectedLabels.length})`;

  const toggle = (optionValue: string, checked: boolean) => {
    const nextSet = new Set(value);
    if (checked) nextSet.add(optionValue);
    else nextSet.delete(optionValue);
    // Keep option order rather than click order.
    onChange(options.map((o) => o.value).filter((v) => nextSet.has(v)));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center justify-between gap-2 h-10 px-3 rounded-xl border bg-white text-sm outline-none",
          "focus-visible:ring-2 focus-visible:ring-[#914A8C]/30",
          value.length > 0
            ? "border-[#914A8C]/50 text-[#914A8C] font-semibold"
            : "border-neutral-200 text-neutral-700",
          className
        )}
      >
        <span className="truncate">{triggerText}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-48 max-h-72 rounded-xl p-1 bg-white border border-neutral-100 shadow-xl">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) => toggle(option.value, checked)}
            className="rounded-lg py-2 cursor-pointer"
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {value.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onChange([])}
              className="rounded-lg py-2 text-neutral-500 cursor-pointer"
            >
              Clear {label.toLowerCase()}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
