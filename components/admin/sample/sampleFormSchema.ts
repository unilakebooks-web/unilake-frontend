import { z } from "zod";
import {
  SAMPLE_AGE_MAX,
  SAMPLE_AGE_MIN,
  SAMPLE_NAME_MAX,
} from "./sampleConfig";

// Mirrors the backend's createSampleBodySchema (validators/sample.schema.ts) for the typed fields; the
// pages and the photo are checked separately by the form. The age input registers with
// `valueAsNumber`, so it receives a real number (NaN when blank), as in awbFormSchema.
export const sampleFormSchema = z.object({
  comicId: z.string().min(1, "Choose a book"),
  childName: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(SAMPLE_NAME_MAX, `At most ${SAMPLE_NAME_MAX} characters`),
  age: z
    .number({ message: "Enter an age" })
    .int("Enter a whole number")
    .min(SAMPLE_AGE_MIN, `At least ${SAMPLE_AGE_MIN}`)
    .max(SAMPLE_AGE_MAX, `At most ${SAMPLE_AGE_MAX}`),
  pronounKey: z.enum(["HE", "SHE"]),
});

export type SampleFormValues = z.infer<typeof sampleFormSchema>;
