"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CouponListFilters as CouponFilters } from "@/app/types/coupon";

type StatusFilter = NonNullable<CouponFilters["status"]>;

// The dropdown would otherwise show the raw value ("ALL") until it is opened.
const STATUS_LABELS: Record<string, string> = {
  ALL: "All statuses",
  active: "Active",
  inactive: "Inactive",
};

interface CouponListFiltersProps {
  onFiltersChange: (filters: { search?: string; status?: StatusFilter }) => void;
}

/** Search and status filter for the admin coupon list, in the same card as the other admin lists. */
export function CouponListFilters({ onFiltersChange }: CouponListFiltersProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  // Same 400ms debounce as the Users, Orders and Customers lists: every change hits the server.
  useEffect(() => {
    const handler = setTimeout(() => {
      onFiltersChange({
        search: search.trim() || undefined,
        status: status === "ALL" ? undefined : (status as StatusFilter),
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [search, status, onFiltersChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-[#914A8C]/15 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search by code or name…"
          aria-label="Search coupons"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl border-neutral-200 bg-white"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <Select value={status} onValueChange={(value) => setStatus(value || "ALL")}>
        <SelectTrigger
          aria-label="Filter by status"
          className="w-full sm:w-[190px] h-10 data-[size=default]:h-10 rounded-xl bg-white border-neutral-200 px-3"
        >
          <SelectValue placeholder="Status">{STATUS_LABELS[status] ?? "All statuses"}</SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-xl" alignItemWithTrigger={false}>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
