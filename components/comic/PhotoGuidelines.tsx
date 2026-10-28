"use client";

import { useState } from "react";
import Image from "next/image";
import { Info } from "lucide-react";
import {
  Dialog,
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

function ConfidentialNote() {
  return (
    <p className="text-[10px] text-[#777] mt-2">
      * All photos are kept confidential and used only for creating your
      personalized book panels.
    </p>
  );
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
      <ul className={`list-disc list-inside space-y-0.5 text-xs text-[#333] ${showImage ? "mb-3" : ""}`}>
        <li>Upload clear photo with closed mouth.</li>
        <li>Make sure the child’s full face is clearly visible.</li>
        <li>No hats, sunglasses, hands or objects should obstruct the face</li>
        <li>Avoid funny/distorted expressions and blurry photos.</li>
        <li>No group photos or distant shots.</li>
      </ul>

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
 * "ⓘ Photo guidelines" button that opens the good/bad example image in a
 * popup. Sits in the personalize form, just above the consent checkbox, on
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
        className={`inline-flex items-center gap-1.5 text-sm font-semibold text-[#3F3C95] hover:underline cursor-pointer ${className}`}
      >
        <Info size={16} className="shrink-0" />
        Photo guidelines
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Wider than the dialog's default sm:max-w-sm — the example image
            carries small baked-in labels that need the room to be legible. */}
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#3F3C95]">
              Photo Guidelines
            </DialogTitle>
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
            <ConfidentialNote />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
