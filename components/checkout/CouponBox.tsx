"use client";

import { useState } from "react";
import { Loader2, Tag } from "lucide-react";
import { previewCoupon } from "@/app/actions/session";
import { AppliedCoupon } from "@/app/types/coupon";
import { formatMoney, getErrorMessage } from "@/lib/utils";

interface CouponBoxProps {
  sessionId: string;
  /** The coupon currently applied, if any. */
  applied: AppliedCoupon | null;
  /** True once login, cover type and delivery country are in place: the price depends on them. */
  canApply: boolean;
  /** Set when a coupon was dropped because the order changed under it. */
  notice?: string | null;
  onApplied: (coupon: AppliedCoupon) => void;
  onRemoved: () => void;
}

export default function CouponBox({
  sessionId,
  applied,
  canApply,
  notice,
  onApplied,
  onRemoved,
}: CouponBoxProps) {
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Collapsed behind a link until wanted: a visible box sends shoppers off to hunt for codes.
  const [expanded, setExpanded] = useState(false);
  const open = expanded || applied !== null || Boolean(notice);

  const handleApply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || !canApply || isChecking) return;

    setIsChecking(true);
    setError(null);
    try {
      // The server checks the code and works out the discount; nothing is
      // reserved or charged until Pay Now.
      const coupon = await previewCoupon(sessionId, trimmed);
      setCode("");
      onApplied(coupon);
    } catch (err) {
      // Backend messages are written for customers ("This code has expired.").
      setError(getErrorMessage(err, "We couldn't check this code. Please try again."));
    } finally {
      setIsChecking(false);
    }
  };

  if (!open) {
    return (
      <div className="bg-white rounded-2xl px-6 py-4 border-2 border-gray-100 shadow-sm">
        <button
          type="button"
          aria-expanded={false}
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-2 text-left text-base font-bold text-[#3F3C95] underline-offset-2 hover:underline cursor-pointer"
        >
          <Tag size={18} className="shrink-0" />
          Have a coupon code?
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
      <h2 className="text-xl font-bold text-[#3F3C95] mb-4">Have a coupon code?</h2>

      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-green-50 border border-green-200 p-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-bold text-green-800">
              <Tag size={16} className="shrink-0" />
              <span className="min-w-0 break-all" title={applied.code}>{applied.code}</span>
              <span className="shrink-0 font-semibold">applied</span>
            </p>
            {applied.name && (
              <p className="text-sm font-medium text-green-800 mt-0.5 break-words" title={applied.name}>{applied.name}</p>
            )}
            <p className="text-sm text-green-700 mt-0.5">
              You save {formatMoney(applied.discountAmount, applied.currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setExpanded(true); // stay open so another code can be tried
              onRemoved();
            }}
            className="shrink-0 text-sm font-bold text-[#3F3C95] underline underline-offset-2 hover:text-[#3F3C95]/80 cursor-pointer"
          >
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} noValidate>
          <label htmlFor="coupon-code" className="sr-only">
            Coupon code
          </label>
          <div className="flex gap-2">
            <input
              id="coupon-code"
              type="text"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your code"
              maxLength={64} // the API accepts up to 64 characters (COUPON_CODE_INPUT_MAX)
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus={expanded}
              disabled={!canApply || isChecking}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "coupon-error" : undefined}
              className="min-w-0 flex-1 h-11 rounded-full border-2 border-gray-200 px-4 text-sm font-semibold uppercase tracking-wide text-gray-800 placeholder:normal-case placeholder:font-medium placeholder:tracking-normal focus:border-[#3F3C95] focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!canApply || isChecking || code.trim() === ""}
              className="h-11 shrink-0 rounded-full border-2 border-[#3F3C95] bg-[#3F3C95] px-5 text-sm font-bold text-white transition-colors hover:bg-[#3F3C95]/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {isChecking ? <Loader2 className="animate-spin" size={16} /> : null}
              Apply
            </button>
          </div>

          {error && (
            <p id="coupon-error" role="alert" className="mt-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          {!canApply && (
            <p className="mt-2 text-xs font-medium text-gray-500">
              Add your delivery address first, then apply your code.
            </p>
          )}
        </form>
      )}

      {notice && !applied && (
        <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          {notice}
        </p>
      )}
    </div>
  );
}
