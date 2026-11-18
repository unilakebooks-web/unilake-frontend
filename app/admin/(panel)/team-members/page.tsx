"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TeamMember } from "@/app/types/teamMember";
import {
  useTeamMembers,
  useToggleTeamMemberStatus,
  useDeleteTeamMember,
  useReorderTeamMembers,
} from "@/hooks/useTeamMembers";

import { TeamMemberPageHeader } from "@/components/admin/teamMember/TeamMemberPageHeader";
import { TeamMemberTable } from "@/components/admin/teamMember/TeamMemberTable";
import { TeamMemberModal } from "@/components/admin/teamMember/TeamMemberModal";
import { TeamMemberDeleteDialog } from "@/components/admin/teamMember/TeamMemberDeleteDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function TeamMembersPage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: members = [], isLoading, isError, error, refetch } = useTeamMembers();
  const toggleStatus = useToggleTeamMemberStatus();
  const deleteMember = useDeleteTeamMember();
  const reorderMembers = useReorderTeamMembers();

  // The order the admin has dragged to but not saved (ids), or null. Kept apart
  // from the server list so an edit, a hide or an add (each refetches the list)
  // never throws away an unsaved drag.
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  // The list as shown: the dragged order, with anyone added meanwhile at the end
  // and anyone removed meanwhile left out.
  const orderedMembers = useMemo(() => {
    if (!localOrder) return members;
    const byId = new Map(members.map((m) => [m.id, m]));
    const dragged = localOrder
      .map((id) => byId.get(id))
      .filter((m): m is TeamMember => m !== undefined);
    const added = members.filter((m) => !localOrder.includes(m.id));
    return [...dragged, ...added];
  }, [members, localOrder]);

  const isOrderDirty =
    localOrder !== null &&
    orderedMembers.map((m) => m.id).join(",") !== members.map((m) => m.id).join(",");

  const handleReorder = (next: TeamMember[]) => {
    // A drag made while the save is in flight would be wiped by the saved answer
    // without a word, so it is ignored (the card snaps back).
    if (reorderMembers.isPending) return;
    const ids = next.map((m) => m.id);
    // Dragged back to the saved order: nothing is unsaved any more.
    setLocalOrder(ids.join(",") === members.map((m) => m.id).join(",") ? null : ids);
  };

  const handleSaveOrder = async () => {
    if (!isOrderDirty || reorderMembers.isPending) return;
    try {
      await reorderMembers.mutateAsync(orderedMembers.map((m) => m.id));
      setLocalOrder(null);
      toast.success("Order has been saved");
    } catch (err) {
      const failure = err as { code?: string; message?: string };
      // A 409 means the list changed since it was loaded (another admin added or
      // removed someone): reload it and start again from the saved order.
      if (failure.code === "CONFLICT") {
        toast.error("The team list changed while you were arranging it, so it was reloaded. Please arrange it again.");
        setLocalOrder(null);
        refetch();
      } else {
        toast.error("Could not save the new order: " + (failure.message || "Network error"));
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (togglingId) return;
    setTogglingId(id);
    try {
      const updated = await toggleStatus.mutateAsync(id);
      toast.success(
        updated.isActive
          ? "Team member visible on storefront"
          : "Team member hidden from storefront"
      );
    } catch (err: any) {
      toast.error("Could not toggle status: " + (err?.message || "Network error"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      toast.success("Team member has been deleted");
    } catch (err: any) {
      toast.error("Failed to delete team member: " + (err?.message || "Server error"));
      throw err;
    }
  };

  const handleAddClick = () => {
    setEditTarget(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (member: TeamMember) => {
    setEditTarget(member);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <TeamMemberPageHeader
        onAddClick={handleAddClick}
        isOrderDirty={isOrderDirty}
        isSavingOrder={reorderMembers.isPending}
        onSaveOrder={handleSaveOrder}
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
            >
              <div className="flex items-center gap-4 w-full">
                <Skeleton className="w-16 h-16 rounded-full bg-[#F8E7D2]/80 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48 bg-[#F8E7D2]/80" />
                  <Skeleton className="h-4 w-32 bg-[#F8E7D2]/60" />
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Skeleton className="h-6 w-12 rounded-full bg-[#F8E7D2]/80" />
                <Skeleton className="h-8 w-8 rounded-xl bg-[#F8E7D2]/80" />
                <Skeleton className="h-8 w-8 rounded-xl bg-[#F8E7D2]/80" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load Team Members</h3>
          <p className="text-sm text-red-600 mb-5">{error?.message || "Unknown error"}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : (
        <TeamMemberTable
          members={orderedMembers}
          onReorder={handleReorder}
          togglingId={togglingId}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEditClick}
          onDelete={(target) => setDeleteTarget(target)}
          onAddFirst={handleAddClick}
        />
      )}

      <TeamMemberModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditTarget(null);
        }}
        member={editTarget}
        onSuccess={() => refetch()}
      />

      <TeamMemberDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        member={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
