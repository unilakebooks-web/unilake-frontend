import { Users } from "lucide-react";

export function UserListPageHeader({
  total,
  adminCount,
}: {
  /** Users matching the current filters. Undefined while loading. */
  total?: number;
  /** Admins across all users. Undefined while loading. */
  adminCount?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-[#914A8C]/10 flex items-center justify-center shrink-0">
        <Users className="w-6 h-6 text-[#914A8C]" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">Users</h1>
        <p className="text-sm font-semibold text-neutral-500">
          {total === undefined || adminCount === undefined
            ? "Loading users…"
            : `${total} ${total === 1 ? "user" : "users"} · ${adminCount} ${
                adminCount === 1 ? "admin" : "admins"
              }`}
        </p>
      </div>
    </div>
  );
}
