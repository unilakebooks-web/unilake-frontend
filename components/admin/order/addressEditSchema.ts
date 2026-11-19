import { z } from "zod";

// ⚠️ Mirrors the backend's editOrderAddressBodySchema (validators/order.schema.ts), which holds
// Shiprocket's own rules (found by trying each field on a real test order), plus the rules the
// backend checks against the order itself (services/orderAddress.service.ts):
//   - an Indian order needs a 6-digit pincode and a 10-digit phone;
//   - a phone never starts with 0 (Shiprocket takes it as a number and would drop the zero).
// The country is not editable (price, currency and the bill follow it), so it is not in the form.
const ENGLISH_TEXT = /^[\x20-\x7E\n]*$/;
const ENGLISH_ONLY = "Shiprocket cannot take non-English letters or emoji in the address: write it in English letters";
const AT_MOST = (n: number) => `At most ${n} characters (Shiprocket's limit)`;

export function buildAddressEditSchema(opts: { country: string | null }) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Name is required")
        .max(100, "At most 100 characters")
        .regex(
          /^[A-Za-z][A-Za-z .'-]*$/,
          "Shiprocket takes only English letters, spaces, dots, hyphens and apostrophes in the name"
        ),
      line1: z.string().trim().min(1, "Address line 1 is required").max(190, AT_MOST(190)).regex(ENGLISH_TEXT, ENGLISH_ONLY),
      line2: z.string().trim().max(190, AT_MOST(190)).regex(ENGLISH_TEXT, ENGLISH_ONLY),
      city: z.string().trim().min(1, "City is required").max(40, AT_MOST(40)),
      state: z.string().trim().min(1, "State is required").max(30, AT_MOST(30)),
      zip: z
        .string()
        .trim()
        .regex(/^[1-9]\d{3,9}$/, "Pincode must be 4 to 10 digits, numbers only, not starting with 0"),
      phone: z.string().trim().regex(/^\d{7,15}$/, "Phone must be 7 to 15 digits, numbers only"),
    })
    .superRefine((values, ctx) => {
      if (opts.country === "IN" && !/^[1-9]\d{5}$/.test(values.zip)) {
        ctx.addIssue({ code: "custom", path: ["zip"], message: "An Indian pincode has 6 digits" });
      }
      if (values.phone.startsWith("0")) {
        ctx.addIssue({ code: "custom", path: ["phone"], message: "The phone number cannot start with 0" });
      } else if (opts.country === "IN" && !/^\d{10}$/.test(values.phone)) {
        ctx.addIssue({ code: "custom", path: ["phone"], message: "An Indian order needs a 10-digit phone number" });
      }
    });
}

export type AddressEditValues = z.infer<ReturnType<typeof buildAddressEditSchema>>;
