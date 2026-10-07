import { z } from "zod";

// Mirrors the backend's confirmDimensionsBodySchema, whose bounds come from
// config/shipping.ts. Kept in sync so a bad value is caught before a 3–5s
// round trip to Shiprocket rather than after it.
export const MIN_DIMENSION_CM = 0.5;
export const MAX_DIMENSION_CM = 200;
export const MIN_WEIGHT_KG = 0.05;
export const MAX_WEIGHT_KG = 30;

// The same placeholder package the backend used when it created the Shiprocket
// order (config/shipping.ts DEFAULT_PACKAGE_*). Prefilled so the common case is
// a glance-and-confirm rather than four measurements.
export const DEFAULT_DIMENSIONS = {
  length: 25,
  breadth: 20,
  height: 1,
  weight: 0.25,
} as const;

// The inputs register with `valueAsNumber`, so these receive real numbers (NaN
// when the field is blank) — no z.coerce, which would widen the schema's input
// type to `unknown` and break react-hook-form's resolver generics.
const dimension = (field: string) =>
  z
    .number({ message: `${field} is required` })
    .min(MIN_DIMENSION_CM, `${field} must be at least ${MIN_DIMENSION_CM} cm`)
    .max(MAX_DIMENSION_CM, `${field} must be at most ${MAX_DIMENSION_CM} cm`);

export const awbFormSchema = z.object({
  length: dimension("Length"),
  breadth: dimension("Breadth"),
  height: dimension("Height"),
  weight: z
    .number({ message: "Weight is required" })
    .min(MIN_WEIGHT_KG, `Weight must be at least ${MIN_WEIGHT_KG} kg`)
    .max(MAX_WEIGHT_KG, `Weight must be at most ${MAX_WEIGHT_KG} kg`),
});

export type AwbFormValues = z.infer<typeof awbFormSchema>;
