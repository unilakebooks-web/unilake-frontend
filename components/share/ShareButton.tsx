"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/BrandIcons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shareUrl } from "@/components/share/shareUrl";

interface ShareButtonProps {
  /** The page to share, as a path on this site (for example "/comic/<id>"). */
  path: string;
  /** Shown in the phone's share sheet and in the WhatsApp message. */
  title: string;
  /** "overlay" is the small round button over a comic cover; "pill" is a labelled button. */
  variant?: "overlay" | "pill";
  className?: string;
}

const OVERLAY_CLASSES =
  "flex items-center justify-center rounded-full bg-white/95 text-[#3F3C95] shadow-md border border-[#3F3C95]/20 hover:bg-white focus-visible:outline-2 focus-visible:outline-[#3F3C95] size-[clamp(32px,9cqw,36px)]";
export const PILL_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#3F3C95] bg-white px-5 py-2 text-sm font-bold text-[#3F3C95] hover:bg-[#EBE7FF] transition-colors focus-visible:outline-2 focus-visible:outline-[#3F3C95]";

const subscribeNothing = () => () => {};

// Only a touch device gets the share sheet: Safari and Edge on a computer also have navigator.share, but the spec
// asks for the copy and WhatsApp options there.
const canUseShareSheet = () =>
  typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches;

/**
 * Share button (feature 14). On a phone it opens the phone's own share sheet; on a computer (or where the sheet is
 * not available) it offers "Copy link" and "WhatsApp". The first render is always the menu, so the server render
 * and the first client render agree; a phone swaps to the share sheet right after.
 *
 * Every click is stopped here: on a comic card, a click anywhere else opens the quick-view popup. The menu is drawn
 * in a portal outside the card's DOM, which the card's click handler already ignores.
 */
export default function ShareButton({ path, title, variant = "pill", className = "" }: ShareButtonProps) {
  // Server render and hydration use `false` (the menu); a phone switches to the share sheet right after.
  const useSheet = useSyncExternalStore(subscribeNothing, canUseShareSheet, () => false);
  const [copied, setCopied] = useState(false);
  const [manualLink, setManualLink] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    []
  );

  const url = shareUrl(path);
  const buttonClasses = `${variant === "overlay" ? OVERLAY_CLASSES : PILL_CLASSES} ${className}`;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const shareWithSheet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({ url, title });
    } catch (error) {
      // Closing the sheet is not an error.
      if ((error as { name?: string })?.name === "AbortError") return;
      setManualLink(url);
      toast.error("Could not open the share menu. Please copy the link below.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied");
    } catch {
      // The clipboard can be missing or refused (some in-app browsers): show the link to copy by hand.
      setManualLink(url);
      toast.error("Could not copy the link. Please copy it from the box.");
    }
  };

  const icon = variant === "overlay" ? <Share2 className="size-[55%]" aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />;
  const label = variant === "overlay" ? null : <span>Share</span>;

  if (useSheet) {
    return (
      <>
        <button type="button" aria-label={`Share ${title}`} className={buttonClasses} onClick={shareWithSheet} onKeyDown={stop}>
          {icon}
          {label}
        </button>
        {manualLink && <ManualLink url={manualLink} floating={variant === "overlay"} />}
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Share ${title}`}
          className={buttonClasses}
          onClick={stop}
          onKeyDown={stop}
        >
          {icon}
          {label}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-44" onClick={stop} onKeyDown={stop}>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); void copyLink(); }}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            Copy link
          </DropdownMenuItem>
          <DropdownMenuItem
            render={
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stop}
              />
            }
          >
            <WhatsAppIcon aria-hidden="true" />
            WhatsApp
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {manualLink && <ManualLink url={manualLink} floating={variant === "overlay"} />}
    </>
  );
}

/** The link in a box that selects itself, for when the clipboard and the share sheet are not available. */
function ManualLink({ url, floating }: { url: string; floating: boolean }) {
  return (
    <input
      readOnly
      value={url}
      aria-label="Link to share"
      onClick={(e) => { e.stopPropagation(); e.currentTarget.select(); }}
      onFocus={(e) => e.currentTarget.select()}
      className={`rounded-md border border-[#3F3C95]/30 bg-white px-3 py-2 text-xs text-[#3F3C95] ${
        floating ? "absolute right-0 top-full z-30 mt-1 w-[56cqw] shadow-md" : "mt-2 block w-full"
      }`}
    />
  );
}
