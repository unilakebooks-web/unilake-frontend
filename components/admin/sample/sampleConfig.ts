// ⚠️ Same values as the backend: config/sample.ts (MAX_SAMPLE_PAGES, SAMPLE_TTL_HOURS,
// SAMPLE_CLEANUP_MARGIN_MS), validators/sample.schema.ts (name length, age range) and
// MAX_VARIANTS_BEFORE_PAYMENT in config/generation.ts. Two repos, so change them together.
// A safety ceiling, not a product limit: the admin may choose the whole book (the live books have 38 and 46 pages).
export const MAX_SAMPLE_PAGES = 100;
export const SAMPLE_TTL_HOURS = 6;
export const SAMPLE_NAME_MAX = 50;
export const SAMPLE_AGE_MIN = 0;
export const SAMPLE_AGE_MAX = 18;
export const MAX_SAMPLE_VERSIONS = 3;

// Files are deleted this long after a sample's life ends: the backend's 10-minute safety margin
// (SAMPLE_CLEANUP_MARGIN_MS) plus up to 5 minutes until the next sweep (the Cloud Scheduler job's
// interval in production, SAMPLE_SWEEP_INTERVAL_MS in jobs/workers/index.ts locally).
export const SAMPLE_CLEANUP_MINUTES = 15;

// What one generated page with a face costs on RunPod, in US dollars (about 1.4 cents; measured
// once for the customer flow, not re-measured). A page without a face is not counted: it needs no
// face swap.
export const COST_PER_FACE_PAGE_USD = 0.014;

/** The estimate shown before generating, in US dollars with two decimals. */
export function estimateSampleCost(facePages: number): string {
  return (facePages * COST_PER_FACE_PAGE_USD).toFixed(2);
}
