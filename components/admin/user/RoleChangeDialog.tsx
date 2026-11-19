"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/app/types/auth";
import type { AdminUserRow } from "@/app/types/user";
import { useUpdateUserRole } from "@/hooks/useAdminUsers";
import { cn, getErrorMessage } from "@/lib/utils";

interface RoleChangeDialogProps {
  /** The user whose role is being changed. Null = closed. */
  user: AdminUserRow | null;
  onOpenChange: (open: boolean) => void;
}

// What each role can do, in plain words. ⚠️ Follows what the backend allows
// (Unilake-backend src/config/subAdminRoutes.ts for the sub-admin, requireStaff for the rest).
const ROLE_CHOICES: { role: UserRole; title: string; label: string; summary: string; description: string }[] = [
  {
    role: UserRole.USER,
    title: "Customer",
    label: "customer",
    summary: "a customer",
    description: "A normal customer account. No access to the admin panel.",
  },
  {
    role: UserRole.SUB_ADMIN,
    title: "Sub-admin",
    label: "sub-admin",
    summary: "a sub-admin",
    description:
      "Handles orders only: view and manage orders, shipping, bills and book PDFs. Cannot see anything else in the admin panel.",
  },
  {
    role: UserRole.ADMIN,
    title: "Master admin",
    label: "Master admin",
    summary: "a Master admin",
    description: "Full access to the admin panel, including users and roles.",
  },
];

/**
 * Confirms a role change. The Master admin picks one of the three roles (the current one is
 * shown but cannot be picked) and sees what it allows before confirming.
 */
export function RoleChangeDialog({ user, onOpenChange }: RoleChangeDialogProps) {
  const { mutateAsync, isPending } = useUpdateUserRole();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const displayName = user.name || user.email;
  const target = ROLE_CHOICES.find((choice) => choice.role === selected);
  // Losing Master access is the change to be careful with.
  const losesMaster = user.role === UserRole.ADMIN && selected !== null && selected !== UserRole.ADMIN;

  const close = (open: boolean) => {
    if (isPending) return;
    if (!open) {
      setErrorMessage(null);
      setSelected(null);
    }
    onOpenChange(open);
  };

  const handleConfirm = async () => {
    if (!target) return;
    setErrorMessage(null);
    try {
      await mutateAsync({ userId: user.id, role: target.role });
      toast.success(`${displayName} is now ${target.summary}`);
      setSelected(null);
      onOpenChange(false);
    } catch (err) {
      // Refusals (self-demotion, last Master admin) come back as 409 with a readable
      // message — show it in place so the admin sees why.
      const message = getErrorMessage(err, "Failed to update role. Please try again.");
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <Dialog open onOpenChange={close}>
      <DialogContent
        className={`sm:max-w-md max-h-[90vh] overflow-y-auto bg-white border shadow-xl rounded-2xl p-6 ${
          losesMaster ? "border-red-200" : "border-[#914A8C]/30"
        }`}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                losesMaster ? "bg-red-100 text-red-600" : "bg-[#914A8C]/10 text-[#914A8C]"
              }`}
            >
              {losesMaster ? <ShieldOff className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Change role
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                Choose what this person can do. It applies from their next request.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 p-3.5 flex flex-col gap-1 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700">
          <p className="text-sm font-bold break-words">{user.name || "—"}</p>
          <p className="text-xs text-neutral-500 break-all">{user.email}</p>
        </div>

        <fieldset className="space-y-2" disabled={isPending}>
          <legend className="sr-only">Role</legend>
          {ROLE_CHOICES.map((choice) => {
            const isCurrent = choice.role === user.role;
            const isChosen = choice.role === selected;
            return (
              <label
                key={choice.role}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border text-left",
                  isCurrent
                    ? "bg-neutral-50 border-neutral-200 opacity-70 cursor-not-allowed"
                    : "cursor-pointer hover:bg-[#914A8C]/5",
                  isChosen && "border-[#914A8C] bg-[#914A8C]/5"
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={choice.role}
                  checked={isChosen}
                  disabled={isCurrent}
                  onChange={() => {
                    setSelected(choice.role);
                    setErrorMessage(null);
                  }}
                  className="mt-1 accent-[#914A8C]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-neutral-900">
                    {choice.title}
                    {isCurrent && (
                      <span className="ml-2 text-[11px] font-semibold text-neutral-500">
                        Current role
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-neutral-500">{choice.description}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 mt-4 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => close(false)}
            disabled={isPending}
            className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-5 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !target || selected === user.role}
            className={`rounded-xl text-white font-semibold h-10 px-5 shadow-sm flex items-center gap-2 cursor-pointer ${
              losesMaster ? "bg-red-600 hover:bg-red-700" : "bg-[#914A8C] hover:bg-[#7a3e75]"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : target ? (
              `Make ${target.label}`
            ) : (
              "Choose a role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
