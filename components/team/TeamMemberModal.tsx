"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import TeamMemberSocials from "@/components/team/TeamMemberSocials";
import type { TeamMember } from "@/app/types/teamMember";

interface TeamMemberModalProps {
  member: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The full, unclamped bio for one team member.
 *
 * Opened from TeamMemberCard's "Read more" button, which only appears when the
 * card's 3-line clamp actually cut the text off. Mirrors the card's content —
 * avatar, name, role, bio, socials — so the modal reads as the same card
 * opened up rather than a different view of the person.
 */
export default function TeamMemberModal({
  member,
  open,
  onOpenChange,
}: TeamMemberModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* max-h + overflow-y keep a very long bio inside the viewport: the body
          scrolls rather than the modal growing past the screen edge. */}
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-[32px] border border-[#914B8C]/20 bg-white p-8 shadow-xl">
        <DialogHeader className="items-center text-center">
          {/* Same avatar treatment as the card, including the initial fallback
              for a member with no photo. */}
          <div className="relative mx-auto w-full aspect-square max-w-[140px] rounded-full overflow-hidden flex items-center justify-center bg-[#914B8C]/10 border-2 border-white shadow-sm">
            {member.imageUrl ? (
              <Image
                src={member.imageUrl}
                alt={member.name}
                fill
                sizes="140px"
                className="object-cover"
              />
            ) : (
              <span
                className={`${chauPhilomeneOne.className} text-[#914B8C] text-4xl uppercase`}
              >
                {member.name.charAt(0)}
              </span>
            )}
          </div>

          {/* DialogTitle, not a plain heading — it is what labels the dialog
              for assistive tech. */}
          <DialogTitle
            className={`${hankenGrotesk.className} text-[#914B8C] font-extrabold text-2xl mt-4`}
          >
            {member.name}
          </DialogTitle>

          <span
            className={`${hankenGrotesk.className} text-[#000000] font-bold text-sm block`}
          >
            ({member.role})
          </span>
        </DialogHeader>

        {member.description && (
          // whitespace-pre-wrap so any line breaks the admin typed survive.
          <p
            className={`${hankenGrotesk.className} text-[#555555] text-sm font-medium leading-relaxed whitespace-pre-wrap text-center`}
          >
            {member.description}
          </p>
        )}

        <TeamMemberSocials member={member} className="pt-2" />
      </DialogContent>
    </Dialog>
  );
}
