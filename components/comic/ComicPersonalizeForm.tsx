"use client";

/**
 * First-time personalization form on the comic detail page.
 *
 * ── DUPLICATION NOTICE ──────────────────────────────────────────────────────
 * `components/personalize/NewPhotoForm.tsx` deliberately duplicates this
 * component's submit flow for the "upload another photo" journey. Two separate
 * forms was a deliberate decision.
 *
 * The consequence: any change to photo validation, the field set, or the
 * create -> update -> upload -> confirm sequence must be made in BOTH files.
 * If you are editing this one, open the other.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback } from "react";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import { PublicComicDetail } from "@/app/types/comic";
import { Check, CloudUpload, Lock, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import ImageCropModal from "./ImageCropModal";
import { MAX_NAME_LENGTH } from "@/lib/dialogueTokens";

interface ComicPersonalizeFormProps {
  comic: PublicComicDetail;
  onSuccess?: (childName: string, redirectUrl: string) => void;
}

export default function ComicPersonalizeForm({ comic, onSuccess }: ComicPersonalizeFormProps) {
  const router = useRouter();

  // Everything starts empty. A pre-selected gender, age or birth month is a
  // value the parent never chose but that ships in their book — "Boy" and "4"
  // submit silently if they skip the field. An unset dropdown forces a real
  // answer and makes the required-field validation below meaningful.
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    age: "",
    birthMonth: "",
    email: "",
    consent: false,
  });

  // The photo is normalized and face-checked the moment it is dropped, not at submit.
  // Everything downstream (session creation, upload) only ever sees a blob that has
  // already passed the gate — so a rejected photo costs nothing but a re-pick, and
  // never leaves a half-filled session behind on the server.
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [normalizedPhoto, setNormalizedPhoto] = useState<Blob | null>(null);
  const [photoState, setPhotoState] = useState<"idle" | "checking" | "ready" | "rejected">("idle");
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
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
          : "We couldn't read that photo. Please try a different one."
      );
    }
  }, [photoPreview]);

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
            : "We couldn't find a face in that photo. Please try a clearer one."
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
          : "We couldn't read that photo. Please try a different one."
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

  const handlePersonalise = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Client-side Validation
    // Gender and age are checked explicitly now that they no longer carry a
    // default — before, an untouched dropdown quietly submitted "Boy" and 4.
    if (!formData.name.trim()) return toast.error("Please enter the child's name");
    if (!formData.gender) return toast.error("Please select the child's gender");
    if (!formData.age) return toast.error("Please select the child's age");
    if (!formData.email) return toast.error("Please enter a notification email");
    if (!formData.consent) return toast.error("You must agree to the privacy policy");
    if (photoState === "checking") return toast.error("Still checking your photo — one moment");
    if (!normalizedPhoto) return toast.error("Please upload a photo of the child");

    setIsLoading(true);

    // Trimmed once, here, so the name that reaches the session, localStorage and
    // the success callback is the same string — stray whitespace would otherwise
    // be stamped into the speech bubbles.
    const childName = formData.name.trim();

    try {
      // The photo was normalized and face-checked at drop time, so by the point we
      // create anything on the server we already know it is usable. Nothing below can
      // fail because of the photo's content.
      const normalizedFile = new File([normalizedPhoto], "normalized.jpg", {
        type: "image/jpeg",
      });

      // 1. Create Session
      setLoadingStep("Creating your session...");
      const sessionResponse = await createSession(comic.id);
      const { id: sessionId, wsRoomToken } = sessionResponse;

      // 2. Update Session Details
      setLoadingStep("Saving details...");
      await updateSession(sessionId, {
        childName,
        age: parseInt(formData.age, 10),
        pronounKey: formData.gender === "Boy" ? "HE" : "SHE",
        notificationEmail: formData.email,
      });

      // 3. Get Upload URL — requested immediately before the PUT, it expires in 5 min.
      setLoadingStep("Uploading photo...");
      const { uploadUrl, key } = await getPhotoUploadUrl(sessionId, "jpg");

      // 4. Upload to R2
      await uploadToR2({
        uploadUrl,
        file: normalizedFile,
        contentType: "image/jpeg",
      });

      // 5. Confirm Photo
      setLoadingStep("Preparing preview...");
      await confirmPhoto(sessionId, key);

      // 6. Save to localStorage
      saveSession(comic.id, {
        sessionId,
        wsRoomToken,
        comicId: comic.id,
        createdAt: new Date().toISOString(),
        childName,
      });

      // 7. Redirect
      const redirectUrl = `/personalize/${sessionId}/preview`;
      if (onSuccess) {
        onSuccess(childName, redirectUrl);
      } else {
        router.push(redirectUrl);
      }

    } catch (error) {
      console.error(error);
      const message = (error as { message?: string } | null)?.message;
      toast.error(message || "An error occurred during personalization. Please try again.");
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className={`w-full bg-white rounded-[24px] border border-[#3F3C95] shadow-xl p-6 sm:p-8 lg:p-10 ${hankenGrotesk.className}`}>
      
      {/* Title & Description */}
      <div className="mb-6">
        <h1 className={`${chauPhilomeneOne.className} text-3xl sm:text-4xl text-[#3F3C95] mb-3`}>
          {comic.title}
        </h1>
        <p className="text-[#555555] text-sm sm:text-base leading-relaxed">
          {comic.description || "All the amazing things a child can grow up to be. This book inspires big dreams."}
        </p>
      </div>

      <hr className="border-t border-gray-200 mb-6" />

      {/* Form Heading */}
      <h2 className="text-xl sm:text-2xl font-medium text-[#333333] mb-6">
        Personalise Your Child&apos;s Book
      </h2>

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 mb-6">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#333333] font-medium">
            Child&apos;s Name *
            <span className="ml-1 font-normal text-gray-400">
              (max {MAX_NAME_LENGTH} characters)
            </span>
          </label>
          <input
            type="text"
            required
            // Hard cap rather than a validation message: the name is stamped
            // into the speech bubbles, and a longer one gets auto-shrunk or
            // clipped at print. Stopping the keystroke is kinder than letting a
            // parent type "Alexandria" and rejecting it at submit. The label
            // above says why input stops, or the field just feels broken.
            maxLength={MAX_NAME_LENGTH}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#3F3C95] transition-colors"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#333333] font-medium">Gender *</label>
          <div className="relative">
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 appearance-none focus:outline-none focus:border-[#3F3C95] transition-colors bg-white cursor-pointer"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              {/* `disabled` on the empty option: gender is required, so once a
                  real choice is made there is no reason to offer a way back to
                  unset. It still shows while nothing is picked. */}
              <option value="" disabled>
                Select gender
              </option>
              <option value="Boy">Boy</option>
              <option value="Girl">Girl</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Age */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#333333] font-medium">Age *</label>
          <div className="relative">
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 appearance-none focus:outline-none focus:border-[#3F3C95] transition-colors bg-white cursor-pointer"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            >
              <option value="" disabled>
                Select age
              </option>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((age) => (
                <option key={age} value={age.toString()}>{age}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Birth Month */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-[#333333] font-medium">Birth Month</label>
          <div className="relative">
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 appearance-none focus:outline-none focus:border-[#3F3C95] transition-colors bg-white cursor-pointer"
              value={formData.birthMonth}
              onChange={(e) => setFormData({ ...formData, birthMonth: e.target.value })}
            >
              {/* Not disabled, unlike gender and age: birth month is optional,
                  so clearing it back to blank has to stay possible. */}
              <option value="">Select month</option>
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Parent's Email (Full width) */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm text-[#333333] font-medium">Email *</label>
          <input
            type="email"
            required
            placeholder="someone@gmail.com"
            // Styled like every other field rather than filled purple with
            // purple placeholder text — that combination read as a real entered
            // value. The example is kept, but greyed so it is clearly a hint.
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-[#333333] placeholder-gray-400 focus:outline-none focus:border-[#3F3C95] transition-colors"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      {/* Photo Upload Dropzone */}
      <div
        {...getRootProps()}
        className={`w-full border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-3 bg-white cursor-pointer transition-colors min-h-[140px]
          ${isDragActive ? "border-[#914A8C] bg-[#914A8C]/5" : ""}
          ${!isDragActive && photoState === "rejected" ? "border-red-400" : ""}
          ${!isDragActive && photoState !== "rejected" ? "border-[#3F3C95] hover:bg-slate-50" : ""}
          ${photoPreview ? "border-solid" : ""}
        `}
      >
        <input {...getInputProps()} />

        {photoPreview ? (
          <div className="relative w-full h-32 flex items-center justify-center">
            <Image
              src={photoPreview}
              alt="Child"
              fill
              className={`object-contain rounded-xl transition-opacity ${
                photoState === "checking" || photoState === "rejected" ? "opacity-40" : ""
              }`}
            />

            {photoState === "checking" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#3F3C95]">
                <Loader2 size={28} className="animate-spin" />
                <span className="text-sm font-medium">Checking photo...</span>
              </div>
            )}

            {photoState === "ready" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                <Check size={14} />
                Looks good
              </div>
            )}

            <button
              onClick={clearPhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 bg-[#3F3C95] rounded-full flex items-center justify-center text-white shadow-md">
              <CloudUpload size={24} strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="text-[#333333] font-medium">Upload Child&apos;s photo *</p>
              <p className="text-sm text-gray-400 mt-1">1 face per photo</p>
            </div>
          </>
        )}
      </div>

      {/* Only hard blocks surface here. Quality warnings are advisory and stay silent. */}
      {photoError ? (
        <p className="text-sm text-red-600 mt-2 mb-6 text-center">{photoError}</p>
      ) : (
        <div className="mb-6" />
      )}

      {/* Consent Checkbox */}
      <div className="flex items-start gap-3 mb-8">
        <div className="flex items-center h-5 mt-0.5">
          <input
            type="checkbox"
            required
            className="w-4 h-4 rounded border-gray-300 text-[#3F3C95] focus:ring-[#3F3C95]"
            checked={formData.consent}
            onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
          />
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          I confirm that I am 18 years of age or older and that I have received permission from the child&apos;s parent or legal guardian to provide this information for the creation of a personalized storybook, in compliance with the <Link href="/privacy" className="text-[#3F3C95] font-medium hover:underline">Privacy Policy</Link>.
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handlePersonalise}
        disabled={isLoading || photoState === "checking"}
        className="relative w-full bg-gradient-to-b from-[#3F3C95] to-[#2B2882] text-white text-base font-extrabold uppercase tracking-wider py-4 rounded-xl border-b-[4px] border-[#C8942A] shadow-[0_4px_10px_rgba(63,60,149,0.3)] hover:brightness-110 active:translate-y-[2px] active:border-b-[2px] transition-all text-center mb-4 disabled:opacity-80 disabled:cursor-wait"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span>{loadingStep}</span>
          </div>
        ) : (
          "PERSONALISE"
        )}
      </button>

      {/* Protection Text */}
      <div className="flex items-center justify-center gap-1.5 text-gray-400">
        <Lock size={12} />
        <span className="text-xs">Your data is protected</span>
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
