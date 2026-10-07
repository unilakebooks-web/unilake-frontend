"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { usePublicThemes } from "@/hooks/usePublicComics";
import { AGE_GROUP_OPTIONS, GENDER_OPTIONS } from "@/lib/comicTags";

interface FilterOption {
  label: string;
  value: string;
}

interface Filter {
  id: string;
  label: string;
  /** Label of the "no filter" option, e.g. "All Ages". */
  allLabel: string;
  options: FilterOption[];
}

interface StoryFiltersProps {
  /** Picked values per filter id. Missing or empty = that filter is off. */
  selected: Record<string, string[]>;
  /** Receives the filter's complete new list (empty clears it). */
  onChange: (filterId: string, values: string[]) => void;
}

/**
 * Multi-select Age / Gender / Theme pills. Within one filter a comic matches if
 * it has ANY picked value; across filters it must match ALL of them.
 *
 * Picking an option toggles it and keeps the dropdown open, so several can be
 * chosen in one go. "All …" clears that filter and closes it.
 */
export default function StoryFilters({ selected, onChange }: StoryFiltersProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: themes, isLoading: themesLoading } = usePublicThemes();

  const filters = useMemo<Filter[]>(() => {
    return [
      {
        id: "ageGroup",
        label: "Age",
        allLabel: "All Ages",
        options: AGE_GROUP_OPTIONS,
      },
      {
        id: "gender",
        label: "Gender",
        allLabel: "All Genders",
        options: GENDER_OPTIONS,
      },
      {
        id: "themeId",
        label: "Theme",
        allLabel: "All Themes",
        options: themes ? themes.map((t) => ({ label: t.name, value: t.id })) : [],
      },
    ];
  }, [themes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFilter = (id: string) => {
    setOpenFilter((prev) => (prev === id ? null : id));
  };

  const toggleOption = (filter: Filter, value: string) => {
    const current = new Set(selected[filter.id] ?? []);
    if (current.has(value)) current.delete(value);
    else current.add(value);
    // Option order, not click order — keeps the pill label stable.
    onChange(
      filter.id,
      filter.options.map((o) => o.value).filter((v) => current.has(v))
    );
  };

  const clearFilter = (filterId: string) => {
    onChange(filterId, []);
    setOpenFilter(null);
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 py-8"
    >
      {filters.map((filter) => {
        const activeValues = selected[filter.id] ?? [];
        const isActive = activeValues.length > 0;

        // Pill text: "Age" with nothing picked, "Age: 3-5 Years" for one value,
        // "Age (2)" for several. Theme names arrive async; until they do, a
        // single active theme falls back to the count form rather than its id.
        const singleLabel =
          activeValues.length === 1
            ? filter.options.find((o) => o.value === activeValues[0])?.label
            : undefined;
        const pillText = !isActive
          ? filter.label
          : singleLabel
            ? `${filter.label}: ${singleLabel}`
            : `${filter.label} (${activeValues.length})`;

        return (
        <div key={filter.id} className="relative">
          {/* Pill Button — filled once a value is chosen, and shows what is
              applied so the user can see it without opening the dropdown. */}
          <button
            onClick={() => toggleFilter(filter.id)}
            aria-expanded={openFilter === filter.id}
            className={`
              flex items-center gap-3 sm:gap-4 px-5 py-2 rounded-full
              border-[2.5px] transition-all duration-300
              ${isActive
                ? "border-[#7C5DFA] bg-[#7C5DFA] shadow-sm"
                : `border-[#D6CFFF] bg-white ${openFilter === filter.id
                    ? "shadow-sm bg-[#F9F8FF]"
                    : "shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md hover:bg-[#F9F8FF]"}`
              }
            `}
          >
            <span
              className={`font-extrabold text-[15px] md:text-base tracking-wide truncate max-w-[180px] sm:max-w-[220px] ${
                isActive ? "text-white" : "text-[#7C5DFA]"
              }`}
            >
              {pillText}
            </span>
            <ChevronDown
              className={`
                w-4 h-4 shrink-0 transition-transform duration-300
                ${isActive ? "text-white" : "text-[#F06B30]"}
                ${openFilter === filter.id ? "rotate-180" : "rotate-0"}
              `}
              strokeWidth={3}
            />
          </button>

          {/* Dropdown Menu */}
          {openFilter === filter.id && (
            <div className="absolute top-full mt-2 w-48 rounded-2xl bg-white shadow-xl border border-[#D6CFFF] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-1 max-h-72 overflow-y-auto">
                {/* "All" — ticked when nothing is picked; clears the filter. */}
                <button
                  onClick={() => clearFilter(filter.id)}
                  className={`
                    w-full flex items-center justify-between gap-2 text-left px-4 py-2.5
                    text-sm font-medium transition-colors duration-150
                    hover:bg-[#F9F8FF] hover:text-[#7C5DFA]
                    ${!isActive ? "bg-[#F9F8FF] text-[#7C5DFA] font-bold" : "text-gray-600"}
                  `}
                >
                  {filter.allLabel}
                  {!isActive && <Check className="w-4 h-4 shrink-0" strokeWidth={3} />}
                </button>

                {filter.options.map((option) => {
                  const isSelected = activeValues.includes(option.value);
                  return (
                  <button
                    key={option.value}
                    role="menuitemcheckbox"
                    aria-checked={isSelected}
                    onClick={() => toggleOption(filter, option.value)}
                    className={`
                      w-full flex items-center justify-between gap-2 text-left px-4 py-2.5
                      text-sm font-medium
                      transition-colors duration-150
                      hover:bg-[#F9F8FF] hover:text-[#7C5DFA]
                      ${isSelected
                        ? "bg-[#F9F8FF] text-[#7C5DFA] font-bold"
                        : "text-gray-600"
                      }
                    `}
                  >
                    {option.label}
                    {isSelected && <Check className="w-4 h-4 shrink-0" strokeWidth={3} />}
                  </button>
                  );
                })}
                {filter.id === "themeId" && themesLoading && (
                  <div className="flex justify-center p-2">
                    <Loader2 className="w-4 h-4 text-[#7C5DFA] animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
