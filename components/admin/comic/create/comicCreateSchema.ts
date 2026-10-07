import { z } from "zod";
import { GenderTag, AgeGroup } from "@/app/types/comic";

/**
 * Genders, age groups and themes are lists — at least one of each. Shared with
 * the edit form in ComicInfoEditor so both enforce exactly the same rules.
 */
export const comicTagFields = {
  genderTags: z
    .array(z.nativeEnum(GenderTag))
    .min(1, "Pick at least one gender"),
  ageGroups: z
    .array(z.nativeEnum(AgeGroup))
    .min(1, "Pick at least one age group"),
  themeIds: z
    .array(z.string().uuid("Invalid theme ID"))
    .min(1, "Pick at least one theme"),
};

export const comicCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  ...comicTagFields,
  pageCount: z.coerce.number().int().positive("Page count must be greater than 0"),
  freePreviewPages: z.coerce.number().int().min(0, "Cannot be negative"),
  description: z.string().optional().or(z.literal("")),
  isBestseller: z.boolean().default(false),
}).refine(data => data.freePreviewPages < data.pageCount, {
  message: "Preview pages must be strictly less than total pages",
  path: ["freePreviewPages"],
});

export type ComicCreateFormValues = z.infer<typeof comicCreateSchema>;
