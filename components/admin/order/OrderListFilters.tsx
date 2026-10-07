"use client";

import { useEffect, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ORDER_STATUSES, type OrderSortBy, type OrderStatus, type SortOrder } from "@/app/types/order";

interface OrderListFiltersProps {
  onFiltersChange: (filters: {
    search?: string;
    status?: OrderStatus;
    sortBy: OrderSortBy;
    sortOrder: SortOrder;
  }) => void;
  /**
   * Seeds the status dropdown on first render, so a link like
   * `/admin/orders?status=SHIPROCKET_FAILED` arrives with the filter already
   * applied AND visibly selected.
   *
   * Read once as initial state, never synced afterwards: once the admin is on
   * the page the dropdown owns the value, and re-syncing from the URL would
   * fight them every time they changed it.
   */
  initialStatus?: OrderStatus;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: "Awaiting payment",
  PAID: "Paid",
  GENERATED: "Generated",
  CONFIRMED: "Confirmed",
  SHIPROCKET_FAILED: "Shiprocket failed",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function OrderListFilters({
  onFiltersChange,
  initialStatus,
}: OrderListFiltersProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(initialStatus ?? "ALL");
  const [sortBy, setSortBy] = useState<OrderSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Longer debounce than the comics filter: that one slices an array already in
  // memory, this one hits the server on every change.
  useEffect(() => {
    const handler = setTimeout(() => {
      onFiltersChange({
        search: search.trim() || undefined,
        status: status === "ALL" ? undefined : (status as OrderStatus),
        sortBy,
        sortOrder,
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [search, status, sortBy, sortOrder, onFiltersChange]);

  const hasActiveFilters = search !== "" || status !== "ALL";

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-[#914A8C]/15 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search by order ID, customer, phone, AWB, child or comic…"
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

      <Select value={status} onValueChange={(val) => setStatus(val || "ALL")}>
        <SelectTrigger className="w-full sm:w-[190px] h-10 rounded-xl bg-white border-neutral-200">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="ALL">All statuses</SelectItem>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={(val) => setSortBy((val as OrderSortBy) || "createdAt")}>
        <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl bg-white border-neutral-200">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="createdAt">Created</SelectItem>
          <SelectItem value="updatedAt">Last updated</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
        title={sortOrder === "desc" ? "Newest first" : "Oldest first"}
        className="h-10 px-3 rounded-xl border-neutral-200 bg-white shrink-0"
      >
        {sortOrder === "desc" ? (
          <ArrowDownAZ className="w-4 h-4" />
        ) : (
          <ArrowUpAZ className="w-4 h-4" />
        )}
      </Button>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={() => {
            setSearch("");
            setStatus("ALL");
          }}
          className="h-10 px-3 text-neutral-500 hover:text-neutral-900 rounded-xl shrink-0"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
