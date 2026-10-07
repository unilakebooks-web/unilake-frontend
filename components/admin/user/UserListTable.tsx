"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ShieldCheck, ShieldOff, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/app/types/auth";
import type { AdminUserRow } from "@/app/types/user";
import { cn } from "@/lib/utils";

function initialsOf(name: string, email: string): string {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  const letters =
    parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

/**
 * Social avatar with an initials fallback. The fallback covers both a missing
 * `image` and one that fails to load — Facebook avatar URLs are signed and
 * expire, so a stored URL can start 403ing at any time.
 */
function UserAvatar({ user }: { user: AdminUserRow }) {
  const [failed, setFailed] = useState(false);

  if (user.image && !failed) {
    return (
      <img
        src={user.image}
        alt=""
        loading="lazy"
        // Google's avatar CDN refuses some requests that carry a Referer.
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-9 h-9 rounded-full object-cover border border-neutral-200 shrink-0"
      />
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-[#914A8C]/10 text-[#914A8C] text-xs font-bold flex items-center justify-center shrink-0">
      {initialsOf(user.name, user.email)}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const isAdmin = role === UserRole.ADMIN;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border shadow-sm whitespace-nowrap",
        isAdmin
          ? "bg-[#914A8C]/10 text-[#914A8C] border-[#914A8C]/30"
          : "bg-neutral-100 text-neutral-600 border-neutral-200"
      )}
    >
      {isAdmin ? "ADMIN" : "USER"}
    </span>
  );
}

interface UserListTableProps {
  users: AdminUserRow[];
  /** The signed-in admin's id — their own row can't be demoted. */
  currentUserId: string | undefined;
  onChangeRole: (user: AdminUserRow) => void;
}

export function UserListTable({ users, currentUserId, onChangeRole }: UserListTableProps) {
  if (users.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-12 text-center flex flex-col items-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#F8E7D2] flex items-center justify-center mb-4">
          <UserSearch className="w-8 h-8 text-[#914A8C]" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">No users found</h3>
        <p className="text-neutral-500 max-w-md">
          No users match your search. Try clearing it or picking a different role.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#914A8C]/5 text-[#914A8C] font-semibold border-b border-[#914A8C]/10 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4 rounded-tl-3xl">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 hidden sm:table-cell">Joined</th>
              <th className="px-6 py-4 text-right rounded-tr-3xl">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isAdmin = user.role === UserRole.ADMIN;
              const demoteBlocked = isSelf && isAdmin;

              return (
                <tr key={user.id} className="hover:bg-white/60 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 truncate max-w-[220px]">
                            {user.name || "—"}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-500 shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-500 truncate max-w-[260px]">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-3 hidden sm:table-cell whitespace-nowrap text-xs text-neutral-500">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {/* Disabled buttons swallow pointer events, so the reason
                        lives on a wrapper rather than the button itself. */}
                    <span
                      className="inline-block"
                      title={demoteBlocked ? "You can't remove your own admin access" : undefined}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={demoteBlocked}
                        onClick={() => onChangeRole(user)}
                        className={cn(
                          "rounded-lg h-8 px-3 font-semibold whitespace-nowrap",
                          isAdmin
                            ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            : "border-[#914A8C]/30 text-[#914A8C] hover:bg-[#914A8C]/10"
                        )}
                      >
                        {isAdmin ? (
                          <>
                            <ShieldOff className="w-3.5 h-3.5 mr-1.5" />
                            Remove admin
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                            Make admin
                          </>
                        )}
                      </Button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
