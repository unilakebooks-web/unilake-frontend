"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CustomerListFiltersProps {
  onSearchChange: (search: string | undefined) => void;
  /** Starts the CSV download for the current search. */
  onExport: () => void;
  isExporting: boolean;
  /** Nothing to export — disables the button. */
  exportDisabled: boolean;
}

export function CustomerListFilters({
  onSearchChange,
  onExport,
  isExporting,
  exportDisabled,
}: CustomerListFiltersProps) {
  const [search, setSearch] = useState("");

  // Same 400ms debounce as the Users and Orders lists — every change hits the server.
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(search.trim() || undefined);
    }, 400);
    return () => clearTimeout(handler);
  }, [search, onSearchChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-[#914A8C]/15 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl border-neutral-200 bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Exports every customer matching the search — not just this page. */}
      <Button
        type="button"
        onClick={onExport}
        disabled={isExporting || exportDisabled}
        className="w-full sm:w-auto h-10 px-4 rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold shrink-0"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        Export CSV
      </Button>
    </div>
  );
}
