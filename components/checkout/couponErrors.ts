// Pure rule for coupon errors at payment time: no React.

// ⚠️ These mirror the coupon error codes in the backend; the other COUPON_ codes
// (COUPON_TOO_MANY_ATTEMPTS, COUPON_CHANGED_RETRY) mean "try again", not "this code was refused".
const COUPON_REJECTION_CODES = [
  "COUPON_INVALID",
  "COUPON_NOT_STARTED",
  "COUPON_EXPIRED",
  "COUPON_USED_UP",
  "COUPON_ALREADY_USED",
  "COUPON_WRONG_CURRENCY",
  "COUPON_NOT_APPLICABLE",
  "COUPON_FIRST_ORDER_ONLY",
];

/** True when the server refused the coupon code itself, so the page should drop it. */
export function isCouponRejection(code: unknown): boolean {
  return typeof code === "string" && COUPON_REJECTION_CODES.includes(code);
}
