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
import { Button } from "@/components/ui/button";
import { UserRole } from "@/app/types/auth";

interface UserListFiltersProps {
  onFiltersChange: (filters: { search?: string; role?: UserRole }) => void;
}

const ROLE_OPTIONS = [
  { value: "ALL", label: "All users" },
  { value: UserRole.ADMIN, label: "Admins" },
  { value: UserRole.USER, label: "Users" },
];

export function UserListFilters({ onFiltersChange }: UserListFiltersProps) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("ALL");

  // Same 400ms debounce as OrderListFilters — every change hits the server.
  useEffect(() => {
    const handler = setTimeout(() => {
      onFiltersChange({
        search: search.trim() || undefined,
        role: role === "ALL" ? undefined : (role as UserRole),
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [search, role, onFiltersChange]);

  const hasActiveFilters = search !== "" || role !== "ALL";

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-[#914A8C]/15 shadow-sm">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search by name or email…"
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

      <Select value={role} onValueChange={(val) => setRole(val || "ALL")}>
        <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl bg-white border-neutral-200">
          <SelectValue placeholder="Role">
            {(value: string) => ROLE_OPTIONS.find((o) => o.value === value)?.label ?? "Role"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {ROLE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={() => {
            setSearch("");
            setRole("ALL");
          }}
          className="h-10 px-3 text-neutral-500 hover:text-neutral-900 rounded-xl shrink-0"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
