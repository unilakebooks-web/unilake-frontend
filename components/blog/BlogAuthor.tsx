import { InstagramIcon, LinkedInIcon } from "@/components/icons/BrandIcons";
import { hankenGrotesk } from "@/app/fonts";
import type { Blog } from "@/app/types/blog";
import type { SiteSetting } from "@/app/types/siteSetting";

export type ResolvedBlogAuthor = { name: string; instagramUrl?: string; linkedinUrl?: string };

/**
 * Who wrote a post: its own author when the admin named one on the post (a guest author), otherwise the
 * site-wide author from the settings. The links always belong to the same author as the name, never mixed:
 * a guest author without links shows no links rather than the site author's. Null when neither has a name.
 */
export function resolveBlogAuthor(blog: Blog, setting: SiteSetting | null): ResolvedBlogAuthor | null {
  const own = blog.authorName?.trim();
  const name = own || setting?.blogAuthorName?.trim();
  if (!name) return null;
  const instagramUrl = (own ? blog.authorInstagramUrl : setting?.blogAuthorInstagramUrl)?.trim();
  const linkedinUrl = (own ? blog.authorLinkedinUrl : setting?.blogAuthorLinkedinUrl)?.trim();
  return { name, ...(instagramUrl && { instagramUrl }), ...(linkedinUrl && { linkedinUrl }) };
}

/**
 * The author line at the top of a blog post (see resolveBlogAuthor), with small links to their Instagram and
 * LinkedIn when saved. Renders nothing at all when there is no author, so a post never shows an empty
 * "Author:" line or an unnamed link row.
 */
export default function BlogAuthor({ author }: { author: ResolvedBlogAuthor | null }) {
  if (!author) return null;
  const { name } = author;

  const links = [
    { url: author.instagramUrl, Icon: InstagramIcon, label: "Instagram" },
    { url: author.linkedinUrl, Icon: LinkedInIcon, label: "LinkedIn" },
  ].filter((link) => link.url);

  return (
    <div className={`${hankenGrotesk.className} flex items-center justify-center gap-3 mb-4 text-[#555555] font-medium`}>
      <span>
        Author: <span className="font-bold text-[#222222]">{name}</span>
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
