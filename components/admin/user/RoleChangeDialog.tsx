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
import { getErrorMessage } from "@/lib/utils";

interface RoleChangeDialogProps {
  /** The user whose role is being flipped. Null = closed. */
  user: AdminUserRow | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Confirms a promote/demote. The direction is derived from the user's current
 * role: an ADMIN is offered removal, anyone else promotion.
 */
export function RoleChangeDialog({ user, onOpenChange }: RoleChangeDialogProps) {
  const { mutateAsync, isPending } = useUpdateUserRole();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) return null;

  const isDemotion = user.role === UserRole.ADMIN;
  const nextRole = isDemotion ? UserRole.USER : UserRole.ADMIN;
  const displayName = user.name || user.email;

  const close = (open: boolean) => {
    if (isPending) return;
    if (!open) setErrorMessage(null);
    onOpenChange(open);
  };

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await mutateAsync({ userId: user.id, role: nextRole });
      toast.success(
        isDemotion
          ? `${displayName} is no longer an admin`
          : `${displayName} is now an admin`
      );
      onOpenChange(false);
    } catch (err) {
      // Refusals (self-demotion, last admin) come back as 409 with a readable
      // message — show it in place so the admin sees why.
      const message = getErrorMessage(err, "Failed to update role. Please try again.");
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <Dialog open onOpenChange={close}>
      <DialogContent
        className={`sm:max-w-md bg-white border shadow-xl rounded-2xl p-6 ${
          isDemotion ? "border-red-200" : "border-[#914A8C]/30"
        }`}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                isDemotion ? "bg-red-100 text-red-600" : "bg-[#914A8C]/10 text-[#914A8C]"
              }`}
            >
              {isDemotion ? <ShieldOff className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                {isDemotion ? "Remove admin access?" : "Make this user an admin?"}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                {isDemotion
                  ? "They'll keep their account as a normal customer."
                  : "They'll get full access to the admin panel."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 p-3.5 flex flex-col gap-1 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700">
          <p className="text-sm font-bold break-words">{user.name || "—"}</p>
          <p className="text-xs text-neutral-500 break-all">{user.email}</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100">
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
            disabled={isPending}
            className={`rounded-xl text-white font-semibold h-10 px-5 shadow-sm flex items-center gap-2 cursor-pointer ${
              isDemotion ? "bg-red-600 hover:bg-red-700" : "bg-[#914A8C] hover:bg-[#7a3e75]"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isDemotion ? (
              "Remove admin"
            ) : (
              "Make admin"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
