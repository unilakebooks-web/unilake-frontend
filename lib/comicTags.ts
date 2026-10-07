import { AgeGroup, GenderTag } from "@/app/types/comic";

/**
 * Gender / age group helpers shared by the admin panel and the storefront.
 *
 * A comic carries a LIST of each (plus a list of themes). The backend stores
 * genders in BOY, GIRL, UNISEX order and age groups youngest first, so the
 * option lists below are in that same order and lists read off a comic can be
 * displayed as-is.
 */

export const GENDER_OPTIONS: { value: GenderTag; label: string }[] = [
  { value: GenderTag.BOY, label: "Boy" },
  { value: GenderTag.GIRL, label: "Girl" },
  { value: GenderTag.UNISEX, label: "Unisex" },
];

export const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: AgeGroup.AGE_0_2, label: "0-2 Years" },
  { value: AgeGroup.AGE_3_5, label: "3-5 Years" },
  { value: AgeGroup.AGE_6_8, label: "6-8 Years" },
  { value: AgeGroup.AGE_9_12, label: "9-12 Years" },
];

/** BOY -> "Boy". Falls back to the raw value for anything unrecognised. */
export function formatGender(gender: GenderTag): string {
  return GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? gender;
}

/** AGE_3_5 -> "3-5". */
export function formatAgeGroup(ageGroup: AgeGroup): string {
  return ageGroup.replace("AGE_", "").replace("_", "-");
}

/**
 * One range spanning the youngest to the oldest group: [AGE_3_5, AGE_6_8] ->
 * "3-8". A single group is just that group ("3-5").
 *
 * Deliberately always one range, even when the groups are not adjacent —
 * [AGE_0_2, AGE_9_12] reads "0-12". Returns null for an empty list so callers
 * pick their own fallback.
 */
export function formatAgeRange(ageGroups: AgeGroup[]): string | null {
  const ordered = AGE_GROUP_OPTIONS.map((o) => o.value).filter((value) =>
    ageGroups.includes(value)
  );
  if (ordered.length === 0) return null;

  const youngest = formatAgeGroup(ordered[0]).split("-")[0];
  const oldest = formatAgeGroup(ordered[ordered.length - 1]).split("-")[1];
  return `${youngest}-${oldest}`;
}

/**
 * Catalogue filters. Each list matches a comic that has ANY of its values;
 * different filters must ALL match. An empty or missing list means no filter.
 */
export interface ComicTagFilters {
  gender?: string[];
  ageGroup?: string[];
  themeId?: string[];
  search?: string;
}

/**
 * Builds the query string for a catalogue request. Lists are sent
 * comma-separated (`?ageGroup=AGE_3_5,AGE_6_8`), which is what the backend's
 * filter schema expects.
 */
export function buildComicFilterParams(filters?: ComicTagFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters?.gender?.length) params.append("gender", filters.gender.join(","));
  if (filters?.ageGroup?.length) params.append("ageGroup", filters.ageGroup.join(","));
  if (filters?.themeId?.length) params.append("themeId", filters.themeId.join(","));
  if (filters?.search) params.append("search", filters.search);

  return params;
}

/**
 * Order-independent copy of the filters for a TanStack query key, so picking
 * the same values in a different order reuses the cached result instead of
 * firing a second identical request.
 */
export function normalizeComicFilters(filters?: ComicTagFilters): ComicTagFilters | undefined {
  if (!filters) return undefined;

  const sorted = (list?: string[]) => (list?.length ? [...list].sort() : undefined);

  return {
    gender: sorted(filters.gender),
    ageGroup: sorted(filters.ageGroup),
    themeId: sorted(filters.themeId),
    search: filters.search || undefined,
  };
}
