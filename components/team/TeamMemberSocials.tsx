import { cn } from "@/lib/utils";
import {
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/icons/BrandIcons";
import type { TeamMember } from "@/app/types/teamMember";

/**
 * The social icon row for one team member.
 *
 * Shared by TeamMemberCard and TeamMemberModal — the two rendered the same
 * three conditional links, so a change to the hover treatment or the icon set
 * had to be made twice. Renders nothing when the member has no links at all,
 * which is what lets the card drop the row entirely rather than reserve space.
 */

// `twitterUrl` keeps its field name — the platform was renamed, the column was
// not. Only the icon and the accessible label say "X".
const SOCIAL_LINKS = [
  { key: "linkedinUrl", Icon: LinkedInIcon, label: "LinkedIn" },
  { key: "instagramUrl", Icon: InstagramIcon, label: "Instagram" },
  { key: "twitterUrl", Icon: XIcon, label: "X" },
] as const;

interface TeamMemberSocialsProps {
  member: TeamMember;
  /** Wrapper classes — lets the card pin the row to the bottom with mt-auto. */
  className?: string;
}

export default function TeamMemberSocials({
  member,
  className,
}: TeamMemberSocialsProps) {
  const links = SOCIAL_LINKS.filter(({ key }) => member[key]);

  if (links.length === 0) return null;

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {links.map(({ key, Icon, label }) => (
        <a
          key={key}
          href={member[key] as string}
          target="_blank"
          rel="noopener noreferrer"
          // Icon-only links have no text for a screen reader to announce.
          aria-label={`${member.name} on ${label}`}
          className="p-2 rounded-full bg-[#914B8C]/10 text-[#914B8C] hover:bg-[#914B8C] hover:text-white transition-colors cursor-pointer"
        >
          <Icon className="w-4 h-4" />
        </a>
      ))}
    </div>
  );
}
