"use client";

import { TeamMember } from "@/app/types/teamMember";
import { Users, Trash2, Edit2, Briefcase, Camera, MessageCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface TeamMemberTableProps {
  members: TeamMember[];
  togglingId: string | null;
  onToggleStatus: (id: string) => void;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
  onAddFirst: () => void;
}

export function TeamMemberTable({
  members,
  togglingId,
  onToggleStatus,
  onEdit,
  onDelete,
  onAddFirst,
}: TeamMemberTableProps) {
  if (members.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#914A8C]/25 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] mb-4 shadow-inner">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 tracking-wide mb-2">
          No Team Members Yet
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 font-medium leading-relaxed">
          Add team members to display them on the About Us page.
        </p>
        <button
          onClick={onAddFirst}
          className="px-6 py-3 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        >
          + Add First Member
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isToggling = togglingId === member.id;
        
        return (
          <div
            key={member.id}
            className={`
              flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 
              bg-white/70 backdrop-blur-sm rounded-2xl border transition-all shadow-sm
              ${member.isActive ? "border-[#914A8C]/20 hover:shadow-md" : "border-neutral-200 opacity-60 grayscale-[0.2] hover:opacity-100 hover:grayscale-0"}
            `}
          >
            {/* Left Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Photo Thumbnail */}
              <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 shrink-0 overflow-hidden relative flex items-center justify-center">
                {member.imageUrl ? (
                  <img 
                    src={member.imageUrl} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-neutral-400 uppercase">
                    {member.name.charAt(0)}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-neutral-800 text-base truncate">
                    {member.name}
                  </h3>
                  {!member.isActive && (
                    <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#914A8C] font-semibold mb-1 truncate">
                  {member.role}
                </p>
                <div className="flex items-center gap-3">
                  <Briefcase className={`w-4 h-4 ${member.linkedinUrl ? "text-blue-600" : "text-neutral-300"}`} />
                  <Camera className={`w-4 h-4 ${member.instagramUrl ? "text-pink-600" : "text-neutral-300"}`} />
                  <MessageCircle className={`w-4 h-4 ${member.twitterUrl ? "text-blue-400" : "text-neutral-300"}`} />
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 shrink-0 justify-end mt-2 sm:mt-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 select-none">
                  Status
                </span>
                <Switch
                  checked={member.isActive}
                  disabled={isToggling}
                  onCheckedChange={() => onToggleStatus(member.id)}
                  className="data-[state=checked]:bg-[#914A8C]"
                />
              </div>

              <div className="w-px h-6 bg-neutral-200 hidden sm:block" />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(member)}
                  className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                  title="Edit Member"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(member)}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete Member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
