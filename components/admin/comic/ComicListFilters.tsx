"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useThemes } from "@/hooks/useThemes";
import { AGE_GROUP_OPTIONS, GENDER_OPTIONS, type ComicTagFilters } from "@/lib/comicTags";
import { MultiSelectFilter } from "./MultiSelectFilter";

interface ComicListFiltersProps {
  onFiltersChange: (filters: ComicTagFilters) => void;
}

/**
 * Search + multi-select Gender / Age / Theme filters for the admin comic list.
 * Within one filter a comic matches if it has ANY picked value; across filters
 * it must match ALL of them. An empty list means that filter is off.
 */
export function ComicListFilters({ onFiltersChange }: ComicListFiltersProps) {
  const { data: themes } = useThemes();

  const [search, setSearch] = useState("");
  const [genders, setGenders] = useState<string[]>([]);
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [themeIds, setThemeIds] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      onFiltersChange({
        search: search || undefined,
        gender: genders.length ? genders : undefined,
        ageGroup: ageGroups.length ? ageGroups : undefined,
        themeId: themeIds.length ? themeIds : undefined,
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [search, genders, ageGroups, themeIds, onFiltersChange]);

  const clearFilters = () => {
    setSearch("");
    setGenders([]);
    setAgeGroups([]);
    setThemeIds([]);
  };

  const hasActiveFilters =
    search || genders.length > 0 || ageGroups.length > 0 || themeIds.length > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-[#914A8C]/15 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search comics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl border-neutral-200 bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <MultiSelectFilter
        label="Gender"
        options={GENDER_OPTIONS}
        value={genders}
        onChange={setGenders}
        className="w-full sm:w-[130px]"
      />

      <MultiSelectFilter
        label="Age Group"
        options={AGE_GROUP_OPTIONS}
        value={ageGroups}
        onChange={setAgeGroups}
        className="w-full sm:w-[140px]"
      />

      <MultiSelectFilter
        label="Theme"
        options={(themes ?? []).map((t) => ({ value: t.id, label: t.name }))}
        value={themeIds}
        onChange={setThemeIds}
        className="w-full sm:w-[160px]"
      />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="h-10 px-3 text-neutral-500 hover:text-neutral-900 rounded-xl"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
