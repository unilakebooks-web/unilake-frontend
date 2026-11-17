// Pure rules for the coupon form: no React, so they can be tested on their own.
// ⚠️ The limits mirror the backend schema (coupon.schema.ts); change both together.

const MAX_MONEY = 99999999.99;
const MAX_LIMIT = 2147483647;
export const CODE_MIN = 4;
export const CODE_MAX = 32;
export const NAME_MAX = 100;
export const DESCRIPTION_MAX = 500;
// ⚠️ Most single-use codes created in one go; also MAX_BULK_COUPONS in the backend (config/coupon.ts).
export const MAX_BULK_COUPONS = 100;

/** Letters, digits and hyphens only, upper-cased; anything else is dropped as it is typed. */
export function sanitizeCode(raw: string): string {
  return raw.replace(/[^A-Za-z0-9-]/g, "").toUpperCase().slice(0, CODE_MAX);
}

/** Digits and at most one dot. */
export function sanitizeDecimal(raw: string): string {
  const cleaned = raw.replace(/[^0-9.]/g, "").slice(0, 15);
  const dot = cleaned.indexOf(".");
  return dot === -1 ? cleaned : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
}

/** Digits only. */
export function sanitizeInteger(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 10);
}

const NOT_A_NUMBER = "Enter a number, for example 20 or 12.5.";
const TOO_MANY_DECIMALS = "Use at most 2 decimal places.";

function isDecimalText(text: string): boolean {
  return /^\d+\.?\d*$/.test(text) || /^\.\d+$/.test(text);
}

function decimalPlaces(text: string): number {
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

export function validateName(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed === "") return "Enter a name for this coupon.";
  if (trimmed.length > NAME_MAX) return `The name can be at most ${NAME_MAX} characters.`;
  return null;
}

export function validateDescription(text: string): string | null {
  return text.trim().length > DESCRIPTION_MAX
    ? `The description can be at most ${DESCRIPTION_MAX} characters.`
    : null;
}

/** Empty is fine (a code is generated). On edit, the coupon's own code is left alone. */
export function validateCode(text: string, original: string | null): string | null {
  const code = text.trim();
  if (code === "" || code === original) return null;
  if (!/^[A-Z0-9-]+$/.test(code)) return "Use only letters, digits and hyphens.";
  if (code.length < CODE_MIN) return `The code must be at least ${CODE_MIN} characters.`;
  if (code.length > CODE_MAX) return `The code can be at most ${CODE_MAX} characters.`;
  if (!/[A-Z0-9]/.test(code)) return "The code needs at least one letter or digit.";
  return null;
}

export function validatePercent(text: string, required: boolean): string | null {
  const t = text.trim();
  if (t === "") return required ? "Enter the percent off." : null;
  if (!isDecimalText(t)) return NOT_A_NUMBER;
  if (decimalPlaces(t) > 2) return TOO_MANY_DECIMALS;
  const value = Number(t);
  if (value <= 0) return "Percent must be more than 0.";
  if (value > 100) return "Percent cannot be more than 100.";
  return null;
}

/** noun is how the field reads in a sentence: "Amount off", "Max discount". */
export function validateMoney(text: string, noun: string, required: boolean): string | null {
  const t = text.trim();
  if (t === "") return required ? `Enter the ${noun.toLowerCase()}.` : null;
  if (!isDecimalText(t)) return NOT_A_NUMBER;
  if (decimalPlaces(t) > 2) return TOO_MANY_DECIMALS;
  const value = Number(t);
  if (value <= 0) return `${noun} must be more than 0.`;
  if (value > MAX_MONEY) return `${noun} cannot be more than 99,999,999.99.`;
  return null;
}

/** A whole number from 1 to 2,147,483,647; empty means no limit. */
export function validateLimit(text: string, noun: string): string | null {
  const t = text.trim();
  if (t === "") return null;
  if (!/^\d+$/.test(t)) return "Use a whole number, like 100.";
  const value = Number(t);
  if (value < 1) return `${noun} must be at least 1.`;
  if (value > MAX_LIMIT) return `${noun} cannot be more than 2,147,483,647.`;
  return null;
}

/** How many single-use codes to create at once: a whole number from 1 to MAX_BULK_COUPONS. */
export function validateQuantity(text: string): string | null {
  const t = text.trim();
  if (t === "") return "Enter how many codes to create.";
  if (!/^\d+$/.test(t)) return "Use a whole number, like 10.";
  const value = Number(t);
  if (value < 1) return "Create at least 1 code.";
  if (value > MAX_BULK_COUPONS) return `You can create at most ${MAX_BULK_COUPONS} codes at once.`;
  return null;
}

export function validatePerCustomer(text: string, totalText: string, singleUse: boolean, firstOrderOnly = false): string | null {
  const own = validateLimit(text, "Uses per customer");
  if (own || text.trim() === "") return own;
  const value = Number(text.trim());
  if (singleUse) {
    return value > 1 ? "A single-use code works once, so this must be 1 or empty." : null;
  }
  if (firstOrderOnly) {
    return value > 1 ? "A first-order coupon can only be used once per customer." : null;
  }
  if (validateLimit(totalText, "Max uses") === null && totalText.trim() !== "" && value > Number(totalText.trim())) {
    return "Uses per customer cannot be more than the total uses.";
  }
  return null;
}

const FIELD_LABELS: Record<string, string> = {
  code: "Code",
  codeLength: "Code length",
  name: "Name",
  description: "Description",
  percentOff: "Percent off",
  amountOff: "Amount off",
  maxDiscount: "Max discount",
  currency: "Currency",
  startsAt: "Start date",
  endsAt: "End date",
  usageLimit: "Max uses",
  perCustomerLimit: "Max uses per customer",
  restrictedToUserId: "Customer",
  comicIds: "Books",
  countryCodes: "Countries",
  coverTypes: "Cover types",
};

const GENERIC = "Something went wrong while saving the coupon. Please try again.";

/**
 * Turns an API error into words an admin can read: drops the "Validation failed -"
 * prefix, shows field names as the form labels, and never shows database or file text.
 */
export function friendlyServerMessage(message: string): string {
  if (/prisma|invocation|\.ts:\d+|\/src\//i.test(message)) return GENERIC;
  const stripped = message.replace(/^\s*validation failed\s*[-:–—]?\s*/i, "").trim();
  if (stripped === "") return GENERIC;
  return stripped.replace(/\b([a-z][A-Za-z]*):\s/g, (whole, key: string) =>
    FIELD_LABELS[key] ? `${FIELD_LABELS[key]}: ` : whole
  );
}
