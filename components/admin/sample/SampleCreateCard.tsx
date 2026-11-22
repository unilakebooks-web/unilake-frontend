"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useComics, useComic } from "@/hooks/useComics";
import { useCreateSample, useDiscardSample } from "@/hooks/useSamples";
import { confirmPhoto, getPhotoUploadUrl } from "@/app/actions/session";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { normalizePhoto } from "@/app/lib/photo-normalize";
import { checkPhoto, warmUpFaceDetector } from "@/app/lib/photo-validate";
import ImageCropModal from "@/components/comic/ImageCropModal";
import { getErrorMessage } from "@/lib/utils";
import {
  estimateSampleCost,
  SAMPLE_CLEANUP_MINUTES,
  SAMPLE_NAME_MAX,
  SAMPLE_TTL_HOURS,
} from "./sampleConfig";
import { sampleFormSchema, type SampleFormValues } from "./sampleFormSchema";
import { SamplePagePicker } from "./SamplePagePicker";

const FIELD =
  "h-10 w-full rounded-xl border border-[#914A8C]/25 bg-white px-3 text-sm font-semibold text-[#914A8C] focus:outline-none focus:ring-2 focus:ring-[#914A8C]/30";

interface SampleCreateCardProps {
  onCreated: (sessionId: string) => void;
  onCancel: () => void;
}

export function SampleCreateCard({
  onCreated,
  onCancel,
}: SampleCreateCardProps) {
  const { data: comics } = useComics();
  const form = useForm<SampleFormValues>({
    resolver: zodResolver(sampleFormSchema),
    mode: "onChange",
    defaultValues: { comicId: "", childName: "", age: 6, pronounKey: "SHE" },
  });
  const {
    register,
    control,
    getValues,
    formState: { errors, isValid },
  } = form;
  const comicId = useWatch({ control, name: "comicId" });
  const {
    data: comic,
    isLoading: comicLoading,
    isError: comicError,
  } = useComic(comicId);
  const createSample = useCreateSample();
  const discardSample = useDiscardSample();

  const [chosen, setChosen] = useState<string[]>([]);

  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [step, setStep] = useState<string | null>(null);

  // The two object URLs (the photo to crop, the cropped preview) are revoked when replaced, when no
  // longer needed and when the card goes away.
  const urlsRef = useRef<{ raw: string | null; preview: string | null }>({
    raw: null,
    preview: null,
  });
  const swapUrl = (kind: "raw" | "preview", next: string | null) => {
    const old = urlsRef.current[kind];
    if (old) URL.revokeObjectURL(old);
    urlsRef.current[kind] = next;
    if (kind === "raw") setRawImageUrl(next);
    else setPhotoPreview(next);
  };
  useEffect(
    () => () => {
      for (const url of Object.values(urlsRef.current))
        if (url) URL.revokeObjectURL(url);
    },
    [],
  );

  const pages = [...(comic?.pages ?? [])].sort(
    (a, b) => a.pageNumber - b.pageNumber,
  );
  // A page that was deleted elsewhere while it was chosen has no tile to take it off, and an emptied book
  // shows no pages at all: the selection is read against the pages the book has now. A page that is only
  // unusable now stays chosen and keeps its tile, so it can still be removed.
  const knownIds = new Set(pages.map((p) => p.id));
  const picked = comic ? chosen.filter((id) => knownIds.has(id)) : chosen;
  const facePages = pages.filter(
    (p) => picked.includes(p.id) && p.hasFace,
  ).length;
  const estimate = estimateSampleCost(facePages);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    warmUpFaceDetector();
    setPhoto(null);
    swapUrl("preview", null);
    setPhotoError(null);
    setChecking(true);
    try {
      const base = await normalizePhoto(file);
      swapUrl("raw", URL.createObjectURL(base));
      setCropOpen(true);
    } catch (err) {
      setPhotoError(getErrorMessage(err, "That photo could not be read."));
    } finally {
      setChecking(false);
    }
  };

  const handleCrop = async (blob: Blob) => {
    setCropOpen(false);
    swapUrl("raw", null);
    setChecking(true);
    try {
      const check = await checkPhoto(blob);
      if (!check.passed) {
        setPhotoError(
          check.blockReason === "multiple_faces"
            ? "More than one face found. Use a photo of one child."
            : "No face found. Use a clearer photo.",
        );
        return;
      }
      setPhoto(blob);
      swapUrl("preview", URL.createObjectURL(blob));
    } catch (err) {
      setPhotoError(
        getErrorMessage(
          err,
          "The photo could not be checked. Try another one.",
        ),
      );
    } finally {
      setChecking(false);
    }
  };

  const ready = isValid && picked.length > 0 && !!photo && !step;

  // A second click before the screen has re-rendered must not start a second sample.
  const submittingRef = useRef(false);

  const handleCreate = async () => {
    if (!photo || submittingRef.current) return;
    submittingRef.current = true;
    const values = getValues();
    let createdId: string | null = null;
    try {
      setStep("Creating the sample...");
      const created = await createSample.mutateAsync({
        comicId: values.comicId,
        childName: values.childName.trim(),
        age: values.age,
        pronounKey: values.pronounKey,
        pageIds: picked,
      });
      createdId = created.sessionId;

      // Requested right before the PUT: the link is valid for 5 minutes.
      setStep("Uploading the photo...");
      const { uploadUrl, key } = await getPhotoUploadUrl(
        created.sessionId,
        "jpg",
      );
      await uploadToR2({
        uploadUrl,
        file: new File([photo], "photo.jpg", { type: "image/jpeg" }),
        contentType: "image/jpeg",
      });
      await confirmPhoto(created.sessionId, key);

      toast.success("Sample created. Check the cost, then generate.");
      onCreated(created.sessionId);
    } catch (err) {
      // A sample that was made but never got its photo would sit there for hours counting against
      // the limits, so it is removed again.
      let removed = false;
      if (createdId) {
        removed = await discardSample.mutateAsync(createdId).then(
          () => true,
          () => false,
        );
      }
      toast.error(
        getErrorMessage(err, "Could not create the sample.") +
          (!createdId
            ? ""
            : removed
              ? " The unfinished sample was removed."
              : " The unfinished sample could not be removed; it ends by itself after a few hours."),
      );
    } finally {
      submittingRef.current = false;
      setStep(null);
    }
  };

  return (
    <div className="rounded-2xl border border-[#914A8C]/20 bg-white p-4 sm:p-6 space-y-5">
      <h2 className="text-lg font-black text-[#914A8C] uppercase tracking-wide">
        New sample
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label
            htmlFor="sample-comic"
            className="text-xs font-bold text-[#914A8C]/80"
          >
            Book
          </Label>
          <select
            id="sample-comic"
            className={FIELD}
            {...register("comicId", { onChange: () => setChosen([]) })}
          >
            <option value="">Choose a book</option>
            {(comics ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.status === "PUBLISHED" ? "published" : "draft"})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="sample-name"
            className="text-xs font-bold text-[#914A8C]/80"
          >
            Child&apos;s name
          </Label>
          <Input
            id="sample-name"
            maxLength={SAMPLE_NAME_MAX}
            aria-invalid={!!errors.childName}
            aria-describedby={
              errors.childName ? "sample-name-error" : undefined
            }
            {...register("childName")}
          />
          {errors.childName && (
            <p
              id="sample-name-error"
              role="alert"
              className="text-xs font-semibold text-red-600"
            >
              {errors.childName.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="sample-age"
              className="text-xs font-bold text-[#914A8C]/80"
            >
              Age
            </Label>
            <Input
              id="sample-age"
              inputMode="numeric"
              aria-invalid={!!errors.age}
              aria-describedby={errors.age ? "sample-age-error" : undefined}
              {...register("age", { valueAsNumber: true })}
            />
            {errors.age && (
              <p
                id="sample-age-error"
                role="alert"
                className="text-xs font-semibold text-red-600"
              >
                {errors.age.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="sample-gender"
              className="text-xs font-bold text-[#914A8C]/80"
            >
              Book for
            </Label>
            <select
              id="sample-gender"
              className={FIELD}
              {...register("pronounKey")}
            >
              <option value="SHE">Girl</option>
              <option value="HE">Boy</option>
            </select>
          </div>
        </div>
      </div>

      {comicId && (
        <div className="space-y-2">
          <p aria-live="polite" className="text-xs font-bold text-[#914A8C]/80">
            Pages to generate ({picked.length} of {pages.length})
          </p>
          {comicLoading ? (
            <p className="text-sm text-[#914A8C]/70">Loading pages...</p>
          ) : comicError ? (
            <p role="alert" className="text-sm font-semibold text-red-600">
              The pages of this book could not be loaded. Choose the book again.
            </p>
          ) : pages.length === 0 ? (
            <p className="text-sm font-semibold text-[#914A8C]/80">
              This book has no pages yet.
            </p>
          ) : (
            <SamplePagePicker
              key={comicId}
              pages={pages}
              chosen={picked}
              onChange={setChosen}
              disabled={!!step}
            />
          )}
        </div>
      )}

      <div className="space-y-2">
        <p
          id="sample-photo-label"
          className="text-xs font-bold text-[#914A8C]/80"
        >
          Photo of the child
        </p>
        <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#914A8C]/40 px-4 py-2.5 text-sm font-bold text-[#914A8C] cursor-pointer focus-within:ring-2 focus-within:ring-[#914A8C]/40">
          <ImagePlus className="w-4 h-4" />
          {photo ? "Choose another photo" : "Choose a photo"}
          <input
            type="file"
            aria-labelledby="sample-photo-label"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="sr-only"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {checking && (
          <p className="text-sm text-[#914A8C]/70">Checking the photo...</p>
        )}
        {photoError && (
          <p role="alert" className="text-sm font-semibold text-red-600">
            {photoError}
          </p>
        )}
        {photoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoPreview}
            alt="Chosen photo"
            className="h-24 w-24 rounded-xl object-cover"
          />
        )}
      </div>

      <div className="rounded-xl bg-[#FFD54A]/25 p-3 text-xs font-semibold text-[#914A8C] space-y-1">
        <p>
          Estimated generation cost: about ${estimate} ({facePages} page
          {facePages === 1 ? "" : "s"} with a face; each regenerate costs the
          same again).
        </p>
        <p>
          A sample is never paid for or printed. Its photo, images and data are
          deleted from storage {SAMPLE_TTL_HOURS} hours after you create it
          (about {SAMPLE_CLEANUP_MINUTES} more minutes for the cleanup, longer
          if a page is still generating), or at once if you discard it. Download
          the PDF before then.
        </p>
      </div>

      <div className="sticky bottom-4 z-40 [@media(max-height:480px)]:static flex flex-wrap items-center gap-3 rounded-2xl border border-[#914A8C]/20 bg-white p-3 shadow-lg">
        <p className="mr-auto text-xs font-bold text-[#914A8C]">
          {picked.length}
          {pages.length > 0 ? ` of ${pages.length}` : ""} pages, about ${estimate}
        </p>
        <Button
          onClick={handleCreate}
          disabled={!ready}
          className="h-10 px-5 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm cursor-pointer"
        >
          {step ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="ml-2">{step}</span>
            </>
          ) : (
            "Create sample"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={!!step}
          className="cursor-pointer"
        >
          Cancel
        </Button>
      </div>

      <ImageCropModal
        open={cropOpen}
        imageSrc={rawImageUrl}
        onConfirm={handleCrop}
        onCancel={() => {
          setCropOpen(false);
          swapUrl("raw", null);
        }}
      />
    </div>
  );
}
