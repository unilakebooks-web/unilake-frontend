/**
 * Wording shown to a customer when the store is not accepting orders.
 *
 * One constant because two places render it: the toast on the preview page's
 * "Continue to checkout" button, and the banner on the comic page.
 *
 * ⚠️ The backend carries its own copy as ORDERS_PAUSED_MESSAGE in
 * checkout.service.ts, which is what it throws if a checkout request reaches it
 * anyway. Separate repos, so the duplication is unavoidable — change both
 * together.
 */
export const ORDERS_PAUSED_MESSAGE =
  "We're not accepting orders right now — but feel free to preview any comic you like.";
