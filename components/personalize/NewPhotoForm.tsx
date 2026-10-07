"use client";

/**
 * "Upload another photo" form — reached from the preview screen when a customer
 * is unhappy with the result and wants to start again with a different photo.
 *
 * ── DUPLICATION NOTICE ──────────────────────────────────────────────────────
 * This deliberately duplicates the submit flow in
 * `components/comic/ComicPersonalizeForm.tsx` (the first-time form on the comic
 * detail page). Two separate forms was a deliberate decision, not an accident.
 *
 * The consequence: any change to photo validation, the field set, or the
 * create -> update -> upload -> confirm sequence must be made in BOTH files.
 * If you are editing one of them, open the other.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Differences from the original, all intentional:
 *   - fields arrive pre-filled from the previous session
 *   - the comic is taken from that session rather than a comic page
 *   - the layout is two-column: static photo guidance beside the form
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Check, CloudUpload, Loader2, X } from "lucide-react";
import { PHOTO_EXAMPLES_IMAGE } from "@/components/comic/PhotoGuidelines";

import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import { SessionSnapshot } from "@/app/types/session";
import {
  createSession,
  updateSession,
  getPhotoUploadUrl,
  confirmPhoto,
} from "@/app/actions/session";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { saveSession } from "@/app/lib/session-storage";
import { normalizePhoto } from "@/app/lib/photo-normalize";
import { checkPhoto } from "@/app/lib/photo-validate";
import ImageCropModal from "@/components/comic/ImageCropModal";
import { MAX_NAME_LENGTH } from "@/lib/dialogueTokens";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface NewPhotoFormProps {
  previousSession: SessionSnapshot;
}

export default function NewPhotoForm({ previousSession }: NewPhotoFormProps) {
  const router = useRouter();

  // Pre-filled from the session being replaced, so the only thing left to do is
  // pick a photo. That inheritance is the point of this screen and stays.
  //
  // What does NOT stay is a fallback the parent never chose. `pronounKey` of
  // THEY or null used to land on "Boy", a missing age on "4", and birthMonth on
  // "November" unconditionally — none of which came from the previous session,
  // and all of which would submit silently. Where there is nothing to inherit
  // the field is now empty and the validation below asks for it.
  const [formData, setFormData] = useState({
    name: previousSession.childName ?? "",
    gender:
      previousSession.pronounKey === "SHE"
        ? "Girl"
        : previousSession.pronounKey === "HE"
          ? "Boy"
          : "",
    age: previousSession.age != null ? String(previousSession.age) : "",
    // Collected but never persisted, so the server has nothing to give back.
    birthMonth: "",
    email: previousSession.notificationEmail ?? "",
    consent: false,
  });

  // The photo is normalized and face-checked the moment it is dropped, not at
  // submit. Everything downstream only ever sees a blob that already passed the
  // gate — so a rejected photo costs nothing but a re-pick, and never leaves a
  // half-filled session behind on the server.
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [normalizedPhoto, setNormalizedPhoto] = useState<Blob | null>(null);
  const [photoState, setPhotoState] = useState<
    "idle" | "checking" | "ready" | "rejected"
  >("idle");
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setNormalizedPhoto(null);
      setPhotoError(null);
      setPhotoState("checking");

      try {
        const baseBlob = await normalizePhoto(file);
        const url = URL.createObjectURL(baseBlob);
        setRawImageUrl(url);
        setCropModalOpen(true);
        setPhotoState("idle");
      } catch (err) {
        console.error("Photo normalization failed:", err);
        setPhotoState("rejected");
        setPhotoError(
          err instanceof Error && err.message
            ? err.message
            : "We couldn't read that photo. Please try a different one.",
        );
      }
    },
    [photoPreview],
  );

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setCropModalOpen(false);
    setPhotoState("checking");
    setPhotoPreview(URL.createObjectURL(croppedBlob));

    try {
      const check = await checkPhoto(croppedBlob);

      if (!check.passed) {
        setPhotoState("rejected");
        setPhotoError(
          check.blockReason === "multiple_faces"
            ? "We found more than one face. Please use a photo of just your child."
            : "We couldn't find a face in that photo. Please try a clearer one.",
        );
        return;
      }

      if (check.warnings.length > 0) {
        console.info("Photo quality warnings (not blocking):", check.warnings);
      }

      setNormalizedPhoto(croppedBlob);
      setPhotoState("ready");
    } catch (err) {
      console.error("Photo check failed:", err);
      setPhotoState("rejected");
      setPhotoError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't read that photo. Please try a different one.",
      );
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    if (rawImageUrl) {
      URL.revokeObjectURL(rawImageUrl);
      setRawImageUrl(null);
    }
    setPhotoState("idle");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "image/heic": [".heic"],
      "image/heif": [".heif"],
    },
    maxFiles: 1,
  });

  const clearPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
    setPhotoPreview(null);
    setRawImageUrl(null);
    setNormalizedPhoto(null);
    setPhotoError(null);
    setPhotoState("idle");
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Gender and age are checked explicitly now that they no longer fall back
    // to an invented default — matches ComicPersonalizeForm.
    if (!formData.name.trim()) return toast.error("Please enter the child's name");
    if (!formData.gender) return toast.error("Please select the child's gender");
    if (!formData.age) return toast.error("Please select the child's age");
    if (!formData.email) return toast.error("Please enter a notification email");
    if (!formData.consent)
      return toast.error("You must agree to the privacy policy");
    if (photoState === "checking")
      return toast.error("Still checking your photo — one moment");
    if (!normalizedPhoto)
      return toast.error("Please upload a photo of the child");

    setIsLoading(true);

    // Trimmed once so the session and localStorage agree — stray whitespace
    // would otherwise be stamped into the speech bubbles.
    const childName = formData.name.trim();

    try {
      const normalizedFile = new File([normalizedPhoto], "normalized.jpg", {
        type: "image/jpeg",
      });

      // 1. Create a BRAND NEW session. The old one is left alone — it keeps its
      //    pages and expires on its own 7-day clock.
      setLoadingStep("Creating your session...");
      const sessionResponse = await createSession(previousSession.comicId);
      const { id: sessionId, wsRoomToken } = sessionResponse;

      // 2. Details
      setLoadingStep("Saving details...");
      await updateSession(sessionId, {
        childName,
        age: parseInt(formData.age, 10),
        // Matches ComicPersonalizeForm exactly. The backend accepts THEY, but
        // neither form offers it — keep the two in step.
        pronounKey: formData.gender === "Boy" ? "HE" : "SHE",
        notificationEmail: formData.email,
      });

      // 3. Upload URL — requested immediately before the PUT, it expires in 5 min.
      setLoadingStep("Uploading photo...");
      const { uploadUrl, key } = await getPhotoUploadUrl(sessionId, "jpg");

      // 4. Upload to R2
      await uploadToR2({
        uploadUrl,
        file: normalizedFile,
        contentType: "image/jpeg",
      });

      // 5. Confirm
      setLoadingStep("Preparing preview...");
      await confirmPhoto(sessionId, key);

      // 6. Store it. Keyed by comicId, so this OVERWRITES the old session's
      //    entry — which is what makes the comic page offer to resume the new
      //    one rather than the abandoned one.
      saveSession(previousSession.comicId, {
        sessionId,
        wsRoomToken,
        comicId: previousSession.comicId,
        createdAt: new Date().toISOString(),
        childName,
      });

      // 7. Into the new session's preview
      router.push(`/personalize/${sessionId}/preview`);
    } catch (error) {
      console.error(error);
      const message = (error as { message?: string } | null)?.message;
      toast.error(
        message || "An error occurred during personalization. Please try again.",
      );
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const childLabel = formData.name.trim() || "your child";

  return (
    <div className={`${hankenGrotesk.className} w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-2 lg:py-4`}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 lg:gap-6 items-start lg:h-full lg:max-h-full">

        {/* ── Left: static guidance ─────────────────────────────────────── */}
        <section className="bg-white rounded-[20px] border-[3px] border-[#914A8C] shadow-xl p-3 sm:p-4 lg:p-5 outline-2 outline-dashed outline-offset-[-8px] outline-[#914A8C]/40 flex flex-col h-full justify-start">
          <h1 className={`${chauPhilomeneOne.className} text-xl sm:text-2xl lg:text-3xl text-[#222] mb-1`}>
            Upload a photo of {childLabel}
          </h1>
          <p className="text-[11px] lg:text-xs text-[#666] mb-2 lg:mb-3">
            One clear photo gives the best graphic novel results.
          </p>

          <div className="relative border-2 border-[#914A8C] rounded-lg p-2.5 lg:p-3 mb-3 lg:mb-4">
            <h2 className="text-[10px] font-bold tracking-wider text-[#914A8C] uppercase mb-1">
              Photo guidelines:
            </h2>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] lg:text-xs text-[#333]">
              <li>Choose a clear, smiling photo.</li>
              <li>Make sure the child’s full face is clearly visible.</li>
              <li>No hats, sunglasses, hands or objects should obstruct the face</li>
              <li>Avoid funny/distorted expressions and blurry photos.</li>
              <li>No group photos or distant shots.</li>
            </ul>
          </div>

          {/* One composite image with the good/bad examples and their labels
              baked in. Full width at its natural aspect ratio. */}
          <Image
            src={PHOTO_EXAMPLES_IMAGE.src}
            alt={PHOTO_EXAMPLES_IMAGE.alt}
            width={PHOTO_EXAMPLES_IMAGE.width}
            height={PHOTO_EXAMPLES_IMAGE.height}
            sizes="(max-width: 1024px) 90vw, 580px"
            className="w-full h-auto rounded-lg"
          />

          <p className="text-[10px] text-[#777] mt-2 lg:mt-3">
            * All photos are kept confidential and used only for creating your
            personalized book panels.
          </p>
        </section>

        {/* ── Right: the form ───────────────────────────────────────────── */}
        <section className="bg-white rounded-[20px] border-[3px] border-[#914A8C] shadow-xl p-3 sm:p-4 lg:p-5 outline-2 outline-dashed outline-offset-[-8px] outline-[#914A8C]/40 flex flex-col h-full justify-start">
          <h2 className={`${chauPhilomeneOne.className} text-lg sm:text-xl lg:text-2xl text-[#222] mb-2 lg:mb-3`}>
            Your Photo
          </h2>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`relative border-2 border-dashed rounded-xl p-2.5 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-[#914A8C] bg-[#914A8C]/5"
                : "border-[#914A8C]/50 hover:border-[#914A8C]"
            }`}
          >
            <input {...getInputProps()} />

            {photoPreview ? (
              <div className="relative w-20 h-20 lg:w-24 lg:h-24 mx-auto">
                <Image
                  src={photoPreview}
                  alt="Selected photo"
                  fill
                  unoptimized
                  className="object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  aria-label="Remove photo"
                  className="absolute -top-2 -right-2 w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow cursor-pointer"
                >
                  <X size={12} className="lg:w-3.5 lg:h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <CloudUpload className="w-6 h-6 lg:w-8 lg:h-8 mx-auto text-neutral-400 mb-1" />
                <p className="text-[13px] lg:text-sm font-bold text-[#333]">Click or drag a photo here</p>
                <p className="text-[9px] lg:text-[10px] text-neutral-500 mt-0.5">
                  One photo • Max 10MB
                </p>
              </>
            )}
          </div>

          {photoState === "checking" && (
            <p className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
              <Loader2 size={14} className="animate-spin" />
              Checking the photo…
            </p>
          )}

          {photoState === "ready" && (
            <p className="mt-2 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <Check size={14} />
              Looks good
            </p>
          )}

          {photoError && (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {photoError}
            </div>
          )}

          <hr className="border-t border-neutral-200 my-3" />

          {/* Details */}
          <div className="space-y-2">
            <div className="space-y-0.5">
              <label className="text-[11px] lg:text-xs font-semibold text-[#333]">
                Child&apos;s name
                <span className="ml-1 font-normal text-gray-400">
                  (max {MAX_NAME_LENGTH})
                </span>
              </label>
              <input
                type="text"
                value={formData.name}
                // Same cap as ComicPersonalizeForm — the name is stamped into
                // the same speech bubbles either way. Was 50, which let this
                // journey submit a name the other one would have refused.
                maxLength={MAX_NAME_LENGTH}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full h-8 lg:h-9 rounded-xl border border-neutral-300 px-3 text-xs focus:outline-none focus:border-[#914A8C]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5 min-w-0">
                <label className="text-[11px] lg:text-xs font-semibold text-[#333]">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full h-8 lg:h-9 rounded-xl border border-neutral-300 px-3 text-xs bg-white focus:outline-none focus:border-[#914A8C]"
                >
                  {/* `disabled`: gender is required, so once a real choice is
                      made there is no reason to offer a way back to unset. It
                      still shows while nothing is inherited or picked. */}
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="Boy">Boy</option>
                  <option value="Girl">Girl</option>
                </select>
              </div>

              <div className="space-y-0.5 min-w-0">
                <label className="text-[11px] lg:text-xs font-semibold text-[#333]">Age</label>
                <select
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  className="w-full h-8 lg:h-9 rounded-xl border border-neutral-300 px-3 text-xs bg-white focus:outline-none focus:border-[#914A8C]"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {Array.from({ length: 19 }, (_, i) => (
                    <option key={i} value={String(i)}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-[11px] lg:text-xs font-semibold text-[#333]">
                Birth month
              </label>
              <select
                value={formData.birthMonth}
                onChange={(e) =>
                  setFormData({ ...formData, birthMonth: e.target.value })
                }
                className="w-full h-8 lg:h-9 rounded-xl border border-neutral-300 px-3 text-xs bg-white focus:outline-none focus:border-[#914A8C]"
              >
                {/* Not disabled, unlike gender and age: birth month is
                    optional, so clearing it back to blank has to stay possible. */}
                <option value="">Select month</option>
                {MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-0.5">
              <label className="text-[11px] lg:text-xs font-semibold text-[#333]">
                Parent&apos;s email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full h-8 lg:h-9 rounded-xl border border-neutral-300 px-3 text-xs focus:outline-none focus:border-[#914A8C]"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-1 lg:pt-0">
              <input
                type="checkbox"
                checked={formData.consent}
                onChange={(e) =>
                  setFormData({ ...formData, consent: e.target.checked })
                }
                className="mt-0.5 w-3.5 h-3.5 lg:w-4 lg:h-4 accent-[#914A8C] cursor-pointer"
              />
              <span className="text-[10px] lg:text-[11px] text-[#555] leading-relaxed">
                I agree to the{" "}
                <Link href="/privacy" className="text-[#914A8C] underline">
                  privacy policy
                </Link>{" "}
                and consent to my child&apos;s photo being used to create this book.
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-2.5 lg:mt-3 w-full px-8 py-2 lg:py-2.5 bg-gradient-to-b from-[#5c58c2] to-[#403A8B] hover:from-[#6a66d0] hover:to-[#4a449d] text-white rounded-full font-bold text-xs uppercase tracking-wider transition-all border-2 border-[#1e1c4a] shadow-[0px_4px_0px_#FFD54A] active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {loadingStep || "Working..."}
              </>
            ) : (
              "Continue to preview"
            )}
          </button>
        </section>
      </div>

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={rawImageUrl}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    </div>
  );
}
