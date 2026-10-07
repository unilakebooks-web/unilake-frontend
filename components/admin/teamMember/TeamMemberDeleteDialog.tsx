"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TriangleAlert, Loader2, Trash2 } from "lucide-react";
import { TeamMember } from "@/app/types/teamMember";

interface TeamMemberDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onConfirm: (id: string) => Promise<void>;
}

export function TeamMemberDeleteDialog({
  open,
  onOpenChange,
  member,
  onConfirm,
}: TeamMemberDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!member) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(member.id);
      onOpenChange(false);
    } catch {
      // Parent displays toast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isDeleting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-red-200 shadow-xl rounded-2xl p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Delete Team Member?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 shrink-0 flex items-center justify-center">
            {member.imageUrl ? (
              <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-neutral-500 uppercase">{member.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-800">{member.name}</div>
            <div className="text-xs font-semibold text-neutral-500">{member.role}</div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-5 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold h-10 px-5 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
