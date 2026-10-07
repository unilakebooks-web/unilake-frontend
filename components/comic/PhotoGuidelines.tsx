import Image from "next/image";

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
 * Static photo-upload guidance displayed on the comic detail page.
 *
 * Shows the same rules and example photos that appear on the re-upload page
 * (NewPhotoForm), so users know what kind of photo to prepare before they
 * start the personalization form.
 */
export default function PhotoGuidelines() {
  return (
    <div className="mt-5 w-full bg-white rounded-[14px] border border-[#3F3C95] shadow-sm p-4">
      <h3 className="text-sm font-bold text-[#3F3C95] mb-2">
        Photo Guidelines
      </h3>

      {/* Text rules */}
      <ul className="list-disc list-inside space-y-0.5 text-xs text-[#333] mb-3">
        <li>Choose a clear, smiling photo.</li>
        <li>Make sure the child’s full face is clearly visible.</li>
        <li>No hats, sunglasses, hands or objects should obstruct the face</li>
        <li>Avoid funny/distorted expressions and blurry photos.</li>
        <li>No group photos or distant shots.</li>
      </ul>

      {/* Good/bad examples — one image, full width at its natural aspect ratio. */}
      <Image
        src={PHOTO_EXAMPLES_IMAGE.src}
        alt={PHOTO_EXAMPLES_IMAGE.alt}
        width={PHOTO_EXAMPLES_IMAGE.width}
        height={PHOTO_EXAMPLES_IMAGE.height}
        sizes="(max-width: 1024px) 90vw, 440px"
        className="w-full h-auto rounded-lg"
      />

      <p className="text-[10px] text-[#777] mt-2">
        * All photos are kept confidential and used only for creating your
        personalized book panels.
      </p>
    </div>
  );
}
