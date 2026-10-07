"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TeamMember } from "@/app/types/teamMember";
import {
  useTeamMembers,
  useToggleTeamMemberStatus,
  useDeleteTeamMember,
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
      <TeamMemberPageHeader onAddClick={handleAddClick} />

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
          members={members}
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
