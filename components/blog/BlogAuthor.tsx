import { InstagramIcon, LinkedInIcon } from "@/components/icons/BrandIcons";
import { hankenGrotesk } from "@/app/fonts";
import type { SiteSetting } from "@/app/types/siteSetting";

/**
 * The author line at the top of a blog post: the one site-wide author from the settings, with small links to
 * their Instagram and LinkedIn when saved. Renders nothing at all until the admin has typed a name, so a post
 * never shows an empty "By" line or an unnamed link row.
 */
export default function BlogAuthor({ setting }: { setting: SiteSetting | null }) {
  const name = setting?.blogAuthorName?.trim();
  if (!name) return null;

  const links = [
    { url: setting?.blogAuthorInstagramUrl?.trim(), Icon: InstagramIcon, label: "Instagram" },
    { url: setting?.blogAuthorLinkedinUrl?.trim(), Icon: LinkedInIcon, label: "LinkedIn" },
  ].filter((link) => link.url);

  return (
    <div className={`${hankenGrotesk.className} flex items-center justify-center gap-3 mb-4 text-[#555555] font-medium`}>
      <span>
        By <span className="font-bold text-[#222222]">{name}</span>
      </span>
      {links.map(({ url, Icon, label }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} on ${label}`}
          className="p-1.5 rounded-full bg-[#914B8C]/10 text-[#914B8C] hover:bg-[#914B8C] hover:text-white transition-colors"
        >
          <Icon className="w-3.5 h-3.5" />
        </a>
      ))}
    </div>
  );
}
