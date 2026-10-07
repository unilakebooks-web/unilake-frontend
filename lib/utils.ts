import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Reads `.message` off a rejected value.
 *
 * Worth a helper because errors from the API are NOT Error instances: the
 * axios interceptor in app/lib/axios.ts rejects with a plain
 * `{ code, message }` object, so `err instanceof Error` is false and
 * `err.message` is only reachable by widening the type.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return fallback;
}

/**
 * Reads the API's error `code` (e.g. "NOT_FOUND", "CONFLICT") off a rejected
 * value. Returns undefined for anything that isn't shaped like our envelope.
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

/**
 * Renders an API money value for display — "₹48,500.00" rather than
 * "INR 48500.00".
 *
 * Amounts arrive as STRINGS (Prisma serialises Decimal that way) and stay
 * strings everywhere else in the app. This is the one place they become a
 * number, and only at the very last step, purely so `Intl.NumberFormat` can
 * group the digits and attach the right symbol. Nothing downstream consumes the
 * result arithmetically, so there is no float rounding to leak anywhere.
 *
 * Deliberately NOT used in dense tables — OrderListTable's `{currency} {amount}`
 * is correct there, where a column of bare aligned numbers reads better than a
 * column of symbols. This is for headline figures.
 *
 * An unrecognised currency code falls back to "CODE 1,234.00" instead of
 * throwing, so a newly enabled country can never break the dashboard.
 */
export function formatMoney(amount: string, currency: string): string {
  const value = parseFloat(amount);
  if (Number.isNaN(value)) return `${currency} ${amount}`;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

/**
 * Compact form for stat tiles where the full figure would wrap — 48500 → "48.5K".
 * Keeps the currency symbol. Falls back to the full format below the threshold,
 * because "850" is not improved by being written "0.9K".
 */
export function formatMoneyCompact(amount: string, currency: string): string {
  const value = parseFloat(amount);
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  if (Math.abs(value) < 100_000) return formatMoney(amount, currency);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return formatMoney(amount, currency);
  }
}

/**
 * Works out what to render for a pricing rule's MRP.
 *
 * Prices arrive from the API as strings (Prisma serializes Decimal that way),
 * and `mrp` is additionally nullable — the column was added after launch, so
 * rows written before then have none.
 *
 * `showMrp` folds both awkward cases into one flag:
 *   - no MRP on the row at all (legacy data)
 *   - an MRP that is not actually higher than the price (no real discount)
 *
 * In either case the strike-through is meaningless, so callers render the
 * price alone. That keeps the null-handling in one place instead of spread
 * across every component that shows a price.
 */
export function resolveMrp(rule: { mrp: string | null; price: string }) {
  const price = parseFloat(rule.price);
  const mrp = rule.mrp === null ? NaN : parseFloat(rule.mrp);

  const showMrp = !Number.isNaN(mrp) && !Number.isNaN(price) && mrp > price;

  return { mrp, price, showMrp };
}
