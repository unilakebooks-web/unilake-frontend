"use client";

import { useState } from "react";
import Image from "next/image";
import { Info, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Composite example image for the photo-guidance panels: good and bad example
 * shots with their labels baked into the image. Shared with
 * components/personalize/NewPhotoForm.tsx so both pages stay in sync.
 */
export const PHOTO_EXAMPLES_IMAGE = {
  src: "/assets/home_page/personalize_page_image.jpeg",
  width: 1546,
  height: 958,
  alt:
    "Photo examples. Good: a smiling child, a happy child, and a detailed close-up of a child's face. " +
    "Bad: a child wearing a hat and sunglasses, a child making a scrunched-up face, " +
    "a child standing far away in a field, and a group photo with multiple faces.",
};

/**
 * The five photo rules. Rules marked `important` are shown in red, as in the
 * client's Photo Guidelines picture. Shared by the card and the phone popup so
 * the two always say the same thing.
 */
const PHOTO_RULES = [
  { text: "Upload clear photo with closed mouth.", important: true },
  { text: "Make sure the child’s full face is clearly visible." },
  { text: "No hats, sunglasses, hands or objects should obstruct the face" },
  { text: "Avoid funny/distorted expressions and blurry photos.", important: true },
  { text: "No group photos or distant shots." },
];

function PhotoRules({
  className = "",
  withConfidentialNote = false,
}: {
  className?: string;
  /** Adds the confidentiality line as the last bullet, as in the client's Photo Guidelines picture. */
  withConfidentialNote?: boolean;
}) {
  return (
    <ul className={`list-disc list-inside space-y-0.5 text-[#333] ${className}`}>
      {PHOTO_RULES.map((rule) => (
        <li
          key={rule.text}
          className={rule.important ? "font-semibold text-red-600" : undefined}
        >
          {rule.text}
        </li>
      ))}
      {withConfidentialNote && <li>{PHOTO_CONFIDENTIAL_TEXT}</li>}
    </ul>
  );
}

/** Shared with components/personalize/NewPhotoForm.tsx so every screen makes the same promise. */
export const PHOTO_CONFIDENTIAL_TEXT =
  "All photos are kept confidential and used only for creating your personalized book panels and deleted after 7 days.";

function ConfidentialNote() {
  return <p className="text-[10px] text-[#777] mt-2">* {PHOTO_CONFIDENTIAL_TEXT}</p>;
}

interface PhotoGuidelinesProps {
  /**
   * False renders the text rules only. Used below the form on phones, where
   * the example image is reached through PhotoGuidelinesButton instead.
   */
  showImage?: boolean;
}

/**
 * Static photo-upload guidance displayed on the comic detail page.
 *
 * Shows the same rules and example photos that appear on the re-upload page
 * (NewPhotoForm), so users know what kind of photo to prepare before they
 * start the personalization form.
 */
export default function PhotoGuidelines({ showImage = true }: PhotoGuidelinesProps) {
  return (
    <div className="mt-5 w-full bg-white rounded-[14px] border border-[#3F3C95] shadow-sm p-4">
      <h3 className="text-sm font-bold text-[#3F3C95] mb-2">
        Photo Guidelines
      </h3>

      {/* Text rules */}
      <PhotoRules className={`text-xs ${showImage ? "mb-3" : ""}`} />

      {/* Good/bad examples — one image, full width at its natural aspect ratio. */}
      {showImage && (
        <Image
          src={PHOTO_EXAMPLES_IMAGE.src}
          alt={PHOTO_EXAMPLES_IMAGE.alt}
          width={PHOTO_EXAMPLES_IMAGE.width}
          height={PHOTO_EXAMPLES_IMAGE.height}
          sizes="(max-width: 1024px) 90vw, 440px"
          className="w-full h-auto rounded-lg"
        />
      )}

      <ConfidentialNote />
    </div>
  );
}

/**
 * "ⓘ Click here for Photo Guidelines: Important" button that opens the full
 * guidelines (good/bad example image, the rules and the confidentiality note)
 * in a popup. Sits in the personalize form, just above the consent checkbox, on
 * phones and tablets — where the full guidelines card is moved below the form
 * and would otherwise be out of sight while the parent picks a photo.
 */
export function PhotoGuidelinesButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline cursor-pointer ${className}`}
      >
        <Info size={16} className="shrink-0" />
        Click here for Photo Guidelines: Important
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Wider than the dialog's default sm:max-w-sm — the example image
            carries small baked-in labels that need the room to be legible.
            Taller than a phone screen: the content scrolls, and the close
            button sits in the header row above the picture so it stays
            visible and easy to hit. The header's negative margins and padding
            mirror the p-4 of DialogContent (components/ui/dialog.tsx). */}
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-lg max-h-[90vh] supports-[height:100dvh]:max-h-[90dvh] overflow-y-auto"
        >
          <DialogHeader className="sticky -top-4 z-10 -mx-4 -mt-4 flex-row items-center justify-between gap-3 rounded-t-xl bg-popover px-4 pt-4 pb-2">
            <DialogTitle className="text-base font-bold text-[#3F3C95]">
              Photo Guidelines
            </DialogTitle>
            <DialogClose
              aria-label="Close photo guidelines"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#3F3C95]/30 text-[#3F3C95] hover:bg-[#3F3C95]/10 focus-visible:ring-2 focus-visible:ring-[#3F3C95] outline-none cursor-pointer"
            >
              <X size={20} />
            </DialogClose>
          </DialogHeader>
          <div className="min-w-0">
            <Image
              src={PHOTO_EXAMPLES_IMAGE.src}
              alt={PHOTO_EXAMPLES_IMAGE.alt}
              width={PHOTO_EXAMPLES_IMAGE.width}
              height={PHOTO_EXAMPLES_IMAGE.height}
              sizes="(max-width: 640px) 90vw, 480px"
              className="w-full h-auto rounded-lg"
            />
            <PhotoRules className="text-sm mt-3" withConfidentialNote />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
