"use client";

import { useState } from "react";
import { Loader2, Tag } from "lucide-react";
import { previewCoupon } from "@/app/actions/session";
import { AppliedCoupon, CouponOffer } from "@/app/types/coupon";
import { formatMoney, getErrorMessage } from "@/lib/utils";
import { endsText, offersHeading, splitOffers } from "./couponOffers";

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
  /** Coupons that fit this order right now; empty when none or still loading. */
  offers?: CouponOffer[];
  /** Asks for a fresh offers list, e.g. after an Apply was refused. */
  onRefreshOffers?: () => void;
}

export default function CouponBox({
  sessionId,
  applied,
  canApply,
  notice,
  onApplied,
  onRemoved,
  offers = [],
  onRefreshOffers,
}: CouponBoxProps) {
  const [code, setCode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Collapsed behind a link until wanted: a visible box sends shoppers off to hunt for codes.
  const [expanded, setExpanded] = useState(false);
  // The offer whose Apply was refused, with the reason shown under its row.
  const [offerError, setOfferError] = useState<{ code: string; message: string } | null>(null);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const open = expanded || applied !== null || Boolean(notice);

  // One apply path for the typed code and the Apply buttons on the offers.
  // Returns an error message for the caller to show, or null when it worked.
  const applyCode = async (trimmed: string): Promise<string | null> => {
    setIsChecking(true);
    try {
      // The server checks the code and works out the discount; nothing is
      // reserved or charged until Pay Now.
      const coupon = await previewCoupon(sessionId, trimmed);
      onApplied(coupon);
      return null;
    } catch (err) {
      // Backend messages are written for customers ("This code has expired.").
      return getErrorMessage(err, "We couldn't check this code. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleApply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || !canApply || isChecking) return;

    setError(null);
    setOfferError(null);
    const message = await applyCode(trimmed);
    if (message === null) setCode("");
    else setError(message);
  };

  const handleApplyOffer = async (offer: CouponOffer) => {
    if (!canApply || isChecking) return;
    setError(null);
    setOfferError(null);
    const message = await applyCode(offer.code);
    if (message !== null) {
      setOfferError({ code: offer.code, message });
      // The offer may be used up or ended since the list loaded.
      onRefreshOffers?.();
    }
  };

  const { shown: shownOffers, hiddenCount } = splitOffers(offers, showAllOffers);
  const offersList =
    !applied && (offers.length > 0 || offerError) ? (
      <div className="mt-4">
        {/* Kept at the top, not under the row: the refused offer leaves the list when it refreshes. */}
        {offerError && (
          <p role="alert" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
            {offerError.code} could not be applied. {offerError.message}
          </p>
        )}
        {offers.length > 0 && <h3 className="text-sm font-bold text-[#3F3C95] mb-2">{offersHeading(offers)}</h3>}
        <ul className="space-y-2">
          {shownOffers.map((offer) => {
            const ends = endsText(offer.endsAt);
            return (
              <li key={offer.code} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-gray-800">
                      <Tag size={16} className="shrink-0 text-[#3F3C95]" />
                      <span className="min-w-0 break-all font-mono" title={offer.code}>{offer.code}</span>
                      {offer.forYou && (
                        <span className="shrink-0 rounded-full bg-[#3F3C95]/10 px-2 py-0.5 text-xs font-bold text-[#3F3C95]">
                          For you
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-gray-700 break-words" title={offer.name}>{offer.name}</p>
                    <p className="mt-0.5 text-sm font-semibold text-green-700">
                      Save {formatMoney(offer.discountAmount, offer.currency)}
                      {ends && <span className="font-medium text-gray-500">{` · ${ends}`}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyOffer(offer)}
                    disabled={!canApply || isChecking}
                    aria-label={`Apply code ${offer.code}`}
                    className="h-10 min-w-[4.5rem] shrink-0 rounded-full border-2 border-[#3F3C95] px-4 text-sm font-bold text-[#3F3C95] transition-colors hover:bg-[#3F3C95]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllOffers(true)}
            className="mt-1 h-10 text-sm font-bold text-[#3F3C95] underline underline-offset-2 hover:text-[#3F3C95]/80 cursor-pointer"
          >
            Show {hiddenCount} more
          </button>
        )}
      </div>
    ) : null;

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
        {offersList}
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

      {offersList}

      {notice && !applied && (
        <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          {notice}
        </p>
      )}
    </div>
  );
}
