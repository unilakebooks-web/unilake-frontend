import { z } from "zod";
import type { SiteSetting, UpdateSiteSettingPayload } from "@/app/types/siteSetting";

/**
 * Optional URL field.
 *
 * Accepts "" because that is what an empty text input produces — the form works
 * in empty strings throughout and only converts to null at submit time (see
 * toPayload below). Validating "" as a URL would make every untouched social
 * field a validation error.
 */
const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().url().safeParse(v).success, {
      message: `${label} must be a valid URL`,
    });

/** Mirrors the backend's GOOGLE_MAPS_HOST check so the admin fails fast. */
const GOOGLE_MAPS_HOST = /^(www\.)?google\.(com|co\.[a-z]{2}|[a-z]{2})$/;

const mapEmbedUrl = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === "") return true;

      let parsed: URL;
      try {
        parsed = new URL(value);
      } catch {
        return false;
      }

      return parsed.protocol === "https:" && GOOGLE_MAPS_HOST.test(parsed.hostname);
    },
    {
      message:
        "Must be an https:// Google Maps link — use the 'Embed a map' option in Google Maps > Share.",
    }
  );

export const siteSettingFormSchema = z.object({
  // Brand
  brandDescription: z.string().trim().max(1000, "Brand description is too long"),

  // Contact page intro
  headline: z.string().trim().max(200, "Headline is too long"),
  description: z.string().trim().max(2000, "Description is too long"),

  // Channels
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Must be a valid email address",
    }),
  phone: z.string().trim().max(30, "Phone is too long"),
  whatsappPhone: z.string().trim().max(30, "WhatsApp number is too long"),
  businessHours: z.string().trim().max(200, "Business hours is too long"),

  // Address
  addressLine1: z.string().trim().max(200, "Address line 1 is too long"),
  addressLine2: z.string().trim().max(200, "Address line 2 is too long"),
  city: z.string().trim().max(100, "City is too long"),
  state: z.string().trim().max(100, "State is too long"),
  zip: z.string().trim().max(20, "ZIP is too long"),
  country: z.string().trim().max(100, "Country is too long"),
  mapEmbedUrl,

  // SEO
  // Maxes match the backend, NOT the 60/160 figures shown in the counter —
  // going past those is a warning the admin is allowed to ignore, so the
  // validator must stay well clear of them.
  metaTitle: z.string().trim().max(120, "Meta title is too long"),
  metaDescription: z.string().trim().max(320, "Meta description is too long"),

  // Socials
  instagramUrl: optionalUrl("Instagram URL"),
  facebookUrl: optionalUrl("Facebook URL"),
  twitterUrl: optionalUrl("Twitter URL"),
  youtubeUrl: optionalUrl("YouTube URL"),
  linkedinUrl: optionalUrl("LinkedIn URL"),
});

export type SiteSettingFormValues = z.infer<typeof siteSettingFormSchema>;

/** Every field blank — the state of a fresh install with nothing saved. */
export const EMPTY_FORM_VALUES: SiteSettingFormValues = {
  brandDescription: "",
  headline: "",
  description: "",
  email: "",
  phone: "",
  whatsappPhone: "",
  businessHours: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  mapEmbedUrl: "",
  metaTitle: "",
  metaDescription: "",
  instagramUrl: "",
  facebookUrl: "",
  twitterUrl: "",
  youtubeUrl: "",
  linkedinUrl: "",
};

/**
 * Server row (nulls) -> form values (empty strings).
 *
 * React controlled inputs cannot take null without warning and switching to
 * uncontrolled mid-life, so the form works exclusively in strings.
 */
export function toFormValues(setting: SiteSetting | null): SiteSettingFormValues {
  if (!setting) return EMPTY_FORM_VALUES;

  const fromRow = (value: string | null) => value ?? "";

  return {
    brandDescription: fromRow(setting.brandDescription),
    headline: fromRow(setting.headline),
    description: fromRow(setting.description),
    email: fromRow(setting.email),
    phone: fromRow(setting.phone),
    whatsappPhone: fromRow(setting.whatsappPhone),
    businessHours: fromRow(setting.businessHours),
    addressLine1: fromRow(setting.addressLine1),
    addressLine2: fromRow(setting.addressLine2),
    city: fromRow(setting.city),
    state: fromRow(setting.state),
    zip: fromRow(setting.zip),
    country: fromRow(setting.country),
    mapEmbedUrl: fromRow(setting.mapEmbedUrl),
    metaTitle: fromRow(setting.metaTitle),
    metaDescription: fromRow(setting.metaDescription),
    instagramUrl: fromRow(setting.instagramUrl),
    facebookUrl: fromRow(setting.facebookUrl),
    twitterUrl: fromRow(setting.twitterUrl),
    youtubeUrl: fromRow(setting.youtubeUrl),
    linkedinUrl: fromRow(setting.linkedinUrl),
  };
}

/**
 * Form values (empty strings) -> API payload (nulls).
 *
 * This conversion is not cosmetic. The API rejects empty strings outright and
 * treats null as "clear this column", so submitting the raw form values would
 * fail validation the moment the admin leaves any field blank — which, on a
 * form with nineteen optional fields, is always.
 *
 * ⚠️ This form covers the TEXT columns only. `acceptingOrders` is deliberately
 * NOT one of its fields and must never become one: this loop sends every key it
 * holds, so a stale copy of that flag would be written back on every save and
 * could silently re-open the store while an admin was only editing a phone
 * number. The store toggle owns that column alone, via its own PATCH.
 *
 * The single cast on the way out is what that guarantee buys: every key of
 * SiteSettingFormValues is a string field, so the built object genuinely is a
 * valid partial payload. Writing through a union-keyed index instead — the
 * payload type is mapped, not a flat Record — is what TypeScript refuses,
 * because it cannot know which key it is narrowing to inside the loop.
 */
export function toPayload(values: SiteSettingFormValues): UpdateSiteSettingPayload {
  const payload: Record<string, string | null> = {};

  for (const [key, value] of Object.entries(values)) {
    const trimmed = value.trim();
    payload[key] = trimmed === "" ? null : trimmed;
  }

  return payload as UpdateSiteSettingPayload;
}
