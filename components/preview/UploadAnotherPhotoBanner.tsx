"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { poppins, protestStrike } from "@/app/fonts";
import { SessionStatus } from "@/app/types/session";
import { cn } from "@/lib/utils";
import ChangePhotoDialog from "./ChangePhotoDialog";

/**
 * Statuses where a generation is still running and the customer must wait.
 *
 * Clicking through in any of these would abandon a job that may be seconds from
 * finishing — and the pages it produced are already paid for in GPU time. The
 * component stays visible (it is part of the page's furniture) but explains
 * itself with a toast instead of navigating.
 *
 * FAILED is deliberately NOT here: a failed generation is precisely when
 * someone wants a different photo, so that case goes straight through.
 */
const GENERATION_IN_PROGRESS: SessionStatus[] = [
  "CREATED",
  "PHOTO_UPLOADED",
  "GENERATING_PREVIEW",
];

interface UploadAnotherPhotoBannerProps {
  sessionId: string;
  status: SessionStatus;
  /**
   * "floating" is the desktop right-hand card, pinned while scrolling.
   * "inline" is the mobile fallback: a normal block above the first page,
   * because there is no room for a rail at phone widths.
   */
  variant: "floating" | "inline";
}

export default function UploadAnotherPhotoBanner({
  sessionId,
  status,
  variant,
}: UploadAnotherPhotoBannerProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);

  const isGenerating = GENERATION_IN_PROGRESS.includes(status);
  const isFloating = variant === "floating";

  const handleClick = () => {
    if (isGenerating) {
      toast.error(
        "Your book is still being created — please let this generation finish first.",
      );
      return;
    }

    setShowDialog(true);
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        isFloating
          ? "w-56 rounded-2xl bg-[#F8E7D2]/95 backdrop-blur-sm border border-[#3F3C95]/15 shadow-lg p-4"
          : "w-full px-4 py-6",
      )}
    >
      <h3
        className={cn(
          poppins.className,
          "font-semibold text-[#222] leading-snug",
          isFloating ? "text-[13px]" : "text-base sm:text-lg max-w-md",
        )}
      >
        Not Getting The Expected Result?
        <br />
        Try Uploading A Different Photo.
      </h3>

      {/* Solid offset shadow rather than a blur, and it shrinks on press so the
          button physically depresses — same treatment as the checkout CTA. */}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          protestStrike.className,
          "rounded-full bg-[#FFD54A] text-[#3F3C95] uppercase tracking-wide transition-all cursor-pointer hover:brightness-105",
          "shadow-[4px_4px_0px_#3F3C95] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#3F3C95]",
          isFloating
            ? "mt-3 px-4 py-2 text-[11px] leading-none"
            : "mt-4 px-7 py-2.5 text-sm",
        )}
      >
        Upload Another Photo
      </button>

      <ChangePhotoDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onConfirm={() => router.push(`/personalize/${sessionId}/new-photo`)}
      />
    </div>
  );
}
