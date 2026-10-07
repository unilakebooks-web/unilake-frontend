"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useCreateComic } from "@/hooks/useComics";
import { useCountries } from "@/hooks/useCountries";
import { getThumbnailUploadUrls } from "@/app/actions/comic";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { CoverType } from "@/app/types/comic";

import { comicCreateSchema, ComicCreateFormValues } from "./comicCreateSchema";
import { ComicDetailsFields } from "./ComicDetailsFields";
import { ThumbnailUploader, ThumbnailItem } from "./ThumbnailUploader";
import { PricingGrid, PricingGridValue } from "./PricingGrid";

export function CreateComicForm() {
  const router = useRouter();
  const { data: countries } = useCountries();
  const { mutateAsync: createComic } = useCreateComic();

  const [thumbnails, setThumbnails] = useState<ThumbnailItem[]>([]);
  const [pricing, setPricing] = useState<PricingGridValue[]>([]);
  
  const [thumbnailError, setThumbnailError] = useState<string>();
  const [pricingError, setPricingError] = useState<string>();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ComicCreateFormValues>({
    resolver: zodResolver(comicCreateSchema) as any,
    defaultValues: {
      title: "",
      // Start empty — the admin must pick at least one of each.
      genderTags: [],
      ageGroups: [],
      themeIds: [],
      pageCount: 24,
      freePreviewPages: 3,
      description: "",
      isBestseller: false,
    },
  });

  const onSubmit = async (data: ComicCreateFormValues) => {
    let hasError = false;

    if (thumbnails.length === 0) {
      setThumbnailError("At least 1 cover thumbnail is required.");
      hasError = true;
    } else {
      setThumbnailError(undefined);
    }

    if (!countries || countries.length === 0) {
      setPricingError("No countries found. Cannot create pricing.");
      hasError = true;
    } else {
      // One row per country per cover type, and each row needs BOTH money
      // fields. updateComicPricing is a full delete-and-replace on the backend,
      // so a partially-filled submission would wipe the rows it omits.
      const requiredCells = countries.length * 2;
      const filledCells = pricing.filter(
        (p) =>
          p.mrp &&
          parseFloat(p.mrp) > 0 &&
          p.price &&
          parseFloat(p.price) > 0
      ).length;

      const invertedRows = pricing.filter(
        (p) =>
          p.mrp &&
          p.price &&
          parseFloat(p.mrp) < parseFloat(p.price)
      );

      if (filledCells < requiredCells) {
        setPricingError("Every MRP and price must be filled with a value > 0.");
        hasError = true;
      } else if (invertedRows.length > 0) {
        // Mirrors the Zod refine so the admin never round-trips to learn this.
        setPricingError("MRP cannot be lower than the selling price.");
        hasError = true;
      } else {
        setPricingError(undefined);
      }
    }

    if (hasError) return;

    try {
      // Step 1: Upload thumbnails to R2
      setIsUploading(true);
      
      const uploadFiles = thumbnails.map(t => ({
        fileName: t.file.name,
        contentType: t.file.type,
      }));
      
      const { uploads } = await getThumbnailUploadUrls(uploadFiles);
      
      const uploadPromises = uploads.map((u, i) => 
        uploadToR2({ 
          uploadUrl: u.uploadUrl, 
          file: thumbnails[i].file, 
          contentType: thumbnails[i].file.type 
        })
      );
      
      await Promise.all(uploadPromises);
      
      const thumbnailKeys = uploads.map(u => u.key);
      
      // Step 2: Create Comic
      setIsUploading(false);
      setIsSubmitting(true);
      
      const payload = {
        title: data.title,
        genderTags: data.genderTags,
        pageCount: data.pageCount,
        freePreviewPages: data.freePreviewPages,
        description: data.description?.trim() || undefined,
        isBestseller: data.isBestseller,
        themeIds: data.themeIds,
        ageGroups: data.ageGroups,
        thumbnailKeys,
        pricing: pricing.map(p => ({
          countryId: p.countryId,
          coverType: p.coverType,
          mrp: parseFloat(p.mrp),
          price: parseFloat(p.price),
        })),
      };

      const comic = await createComic(payload);
      
      toast.success("Comic created successfully!");
      router.push(`/admin/comics/${comic.id}`); // Navigate to hub page (Overview tab)
      
    } catch (err: any) {
      toast.error(err?.message || "Failed to create comic");
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const isWorking = isUploading || isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-neutral-900">1. Comic Details</h2>
            <p className="text-sm text-neutral-500">Basic information about the comic.</p>
          </div>
          <ComicDetailsFields form={form} />
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-neutral-900">2. Cover Thumbnails</h2>
            <p className="text-sm text-neutral-500">Images for the storefront. The first image will be the primary cover.</p>
          </div>
          <ThumbnailUploader 
            items={thumbnails} 
            onChange={(items) => { setThumbnails(items); setThumbnailError(undefined); }} 
            error={thumbnailError}
          />
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-neutral-900">3. Pricing</h2>
            <p className="text-sm text-neutral-500">Set prices for all available countries.</p>
          </div>
          <PricingGrid 
            values={pricing}
            onChange={(vals) => { setPricing(vals); setPricingError(undefined); }}
            error={pricingError}
          />
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <Button
            type="button"
            variant="outline"
            disabled={isWorking}
            onClick={() => router.push("/admin/comics")}
            className="mr-3 h-12 px-6 rounded-xl border-neutral-300 font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isWorking}
            className="h-12 px-8 rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white shadow-md font-bold text-base transition-all active:scale-95"
          >
            {isUploading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading thumbnails...</>
            ) : isSubmitting ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating comic...</>
            ) : (
              "Create Comic"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
