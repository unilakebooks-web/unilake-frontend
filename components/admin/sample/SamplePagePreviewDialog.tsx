"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toImageUrl } from "@/lib/imageUrl";

// The wait before the one retry of a picture whose first download failed (the optimiser can time out while
// it fetches a 2 to 7 MB original for the first time; a moment later the original is usually cached).
const RETRY_DELAY_MS = 1500;

interface SamplePageImageProps {
  url: string;
  /** The picture's own size in pixels: Next offers this width and twice it (by screen density). */
  size: number;
  alt: string;
  className?: string;
}

/**
 * A page's template artwork, small. Served through the site's image optimiser (the originals are
 * 2 to 7 MB). An address that is not https (local MinIO; next.config.ts only allows https) is shown
 * as it is, decided here before rendering. An https picture that fails shows a placeholder and never
 * the original, so a failing optimiser cannot make the admin download every full-size page. A slow
 * first download (the optimiser fetches the 2 to 7 MB original) gets one retry before that.
 */
export function SamplePageImage({
  url,
  size,
  alt,
  className = "",
}: SamplePageImageProps) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const src = toImageUrl(url);

  useEffect(() => {
    if (!retrying) return;
    const timer = setTimeout(() => {
      setAttempt(1);
      setRetrying(false);
    }, RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [retrying]);

  const onError = () => {
    if (attempt === 0) setRetrying(true);
    else setFailed(true);
  };

  // While waiting for the retry the picture is not drawn, so no broken-image text shows.
  if (failed || retrying) {
    return (
      <span
        className={`flex items-center justify-center text-neutral-400 ${className}`}
      >
        <ImageIcon className="w-6 h-6 opacity-60" aria-hidden="true" />
      </span>
    );
  }
  if (!src.startsWith("https://")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        key={attempt}
        onError={onError}
        className={`object-contain ${className}`}
      />
    );
  }
  return (
    <Image
      key={attempt}
      src={src}
      alt={alt}
      width={size}
      height={size}
      onError={onError}
      className={`object-contain ${className}`}
    />
  );
}

interface SamplePagePreviewDialogProps {
  /** The page to show; the dialog is closed when it is undefined. */
  page:
    { id: string; pageNumber: number; artworkUrl: string | null } | undefined;
  /** "with face", "no face", or why the page cannot be generated. */
  label: string;
  /** False for a page without artwork (the grid shows a placeholder for it too). */
  showPicture: boolean;
  selected: boolean;
  /** Why the select button is off, or null when it works. */
  blockedReason: string | null;
  /** True while the sample is being created: the select button is off. */
  busy: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function SamplePagePreviewDialog({
  page,
  label,
  showPicture,
  selected,
  blockedReason,
  busy,
  onToggle,
  onClose,
}: SamplePagePreviewDialogProps) {
  return (
    <Dialog open={!!page} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl p-4 grid-cols-[minmax(0,1fr)]">
        {page && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-[#914A8C]">
                Page {page.pageNumber}
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-[#914A8C]/80">
                {label}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center rounded-xl bg-neutral-100 p-2">
              {page.artworkUrl && showPicture ? (
                <SamplePageImage
                  key={page.artworkUrl}
                  url={page.artworkUrl}
                  size={540}
                  alt={`Page ${page.pageNumber}`}
                  className="max-h-[50vh] w-full [@media(max-height:480px)]:max-h-[30vh]"
                />
              ) : (
                <ImageIcon
                  className="w-10 h-10 text-neutral-400 my-10"
                  aria-hidden="true"
                />
              )}
            </div>
            <DialogFooter className="items-center gap-2 sm:gap-3">
              {blockedReason && !selected && (
                <p className="text-xs font-semibold text-[#914A8C]/80 sm:mr-auto">
                  {blockedReason}
                </p>
              )}
              <Button
                type="button"
                onClick={onToggle}
                disabled={busy || (!selected && !!blockedReason)}
                className="h-10 px-5 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm cursor-pointer"
              >
                {selected ? "Remove this page" : "Select this page"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
