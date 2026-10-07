import * as z from "zod";

/**
 * Form validation for a saved address. Shared by the checkout address picker
 * and the dashboard address form, so the two can never disagree about what a
 * valid address is — they used to be two hand-kept copies.
 *
 * Mirrors the backend's createAddressSchema. Address line 2 is required (the
 * backend enforces it too). Label is the only optional field; left empty it is
 * dropped from the request by `toCreateAddressInput`, never sent as null — the
 * backend rejects a null label on create.
 */
export const addressFormSchema = z.object({
  label: z.string().trim().max(50, "Maximum 50 characters"),
  name: z.string().trim().min(1, "Recipient name is required").max(100, "Maximum 100 characters"),
  line1: z.string().trim().min(1, "Address line 1 is required").max(200, "Maximum 200 characters"),
  line2: z.string().trim().min(1, "Address line 2 is required").max(200, "Maximum 200 characters"),
  city: z.string().trim().min(1, "City is required").max(100, "Maximum 100 characters"),
  state: z.string().trim().min(1, "State is required").max(100, "Maximum 100 characters"),
  zip: z.string().trim().min(1, "ZIP/Postal code is required").max(20, "Maximum 20 characters"),
  country: z.string().length(2, "Please select a country"),
  phone: z.string().trim().min(5, "Phone number too short").max(20, "Phone number too long"),
}).superRefine((values, ctx) => {
  // Indian pincodes are exactly 6 digits. Every other country keeps the loose
  // rule above, since postal formats differ (UK, Canada carry letters). The
  // backend does not enforce this — frontend only, by decision.
  if (values.country === "IN" && !/^\d{6}$/.test(values.zip.trim())) {
    ctx.addIssue({
      code: "custom",
      path: ["zip"],
      message: "Enter a valid 6-digit pincode",
    });
  }
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

/** A blank form. `country` pre-selects the visitor's chosen country, if any. */
export function emptyAddressForm(country = ""): AddressFormValues {
  return { label: "", name: "", line1: "", line2: "", city: "", state: "", zip: "", country, phone: "" };
}

/**
 * An existing address as form values. Old addresses may have no line 2 (saved
 * before it became required) — it loads as empty and must be filled to save.
 */
export function addressToForm(address: {
  label: string | null;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}): AddressFormValues {
  return {
    label: address.label ?? "",
    name: address.name,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country,
    phone: address.phone,
  };
}

/** Request body for creating an address: an empty label is left out. */
export function toCreateAddressInput(values: AddressFormValues) {
  const { label, ...rest } = values;
  return label ? { ...rest, label } : rest;
}
