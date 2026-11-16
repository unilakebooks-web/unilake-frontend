"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Ticket, TriangleAlert } from "lucide-react";
import type {
  Coupon,
  CouponDiscountType,
  CouponInput,
  CouponKind,
} from "@/app/types/coupon";
import { CoverType } from "@/app/types/comic";
import { useCountries } from "@/hooks/useCountries";
import { useComics } from "@/hooks/useComics";
import { useCouponCustomerSearch } from "@/hooks/useCoupons";
import { getErrorMessage } from "@/lib/utils";
import { PAYMENT_MINIMUM } from "@/components/checkout/couponOffers";
import { couponStatus, toIstDate, todayInIst } from "./couponFormat";
import { FieldError, FormSection, ScopePicker, hintClass, labelClass, selectClass } from "./CouponFormParts";
import {
  CODE_MAX,
  CODE_MIN,
  DESCRIPTION_MAX,
  NAME_MAX,
  friendlyServerMessage,
  sanitizeCode,
  sanitizeDecimal,
  sanitizeInteger,
  validateCode,
  validateDescription,
  validateLimit,
  validateMoney,
  validateName,
  validatePerCustomer,
  validatePercent,
} from "./couponFormRules";

export type CouponModalMode = "create" | "edit";

interface CouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CouponModalMode;
  initialData: Coupon | null;
  onSave: (payload: CouponInput) => Promise<void>;
}

const COVER_OPTIONS: { value: CoverType; label: string }[] = [
  { value: CoverType.HARDCOVER, label: "Hardcover" },
  { value: CoverType.SOFTCOVER, label: "Softcover" },
];

/** Empty text -> null; otherwise the number (the server checks it). */
function numberOrNull(text: string): number | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : Number(trimmed);
}

interface CouponFormProps {
  mode: CouponModalMode;
  initialData: Coupon | null;
  onSave: CouponModalProps["onSave"];
  onClose: () => void;
}

// Mounted fresh each time the dialog opens, so the fields start from the coupon being edited.
function CouponForm({ mode, initialData, onSave, onClose }: CouponFormProps) {
  const isEdit = mode === "edit";
  const c = isEdit ? initialData : null;

  const [code, setCode] = useState(c?.code ?? "");
  const [name, setName] = useState(c?.name ?? "");
  const [description, setDescription] = useState(c?.description ?? "");
  const [kind, setKind] = useState<CouponKind>(c?.kind ?? "PUBLIC");
  const [discountType, setDiscountType] = useState<CouponDiscountType>(c?.discountType ?? "PERCENT");
  const [percentOff, setPercentOff] = useState(c?.percentOff ? String(parseFloat(c.percentOff)) : "");
  const [amountOff, setAmountOff] = useState(c?.amountOff ? String(parseFloat(c.amountOff)) : "");
  const [maxDiscount, setMaxDiscount] = useState(c?.maxDiscount ? String(parseFloat(c.maxDiscount)) : "");
  const [currency, setCurrency] = useState(c?.currency ?? "");
  const [startsAt, setStartsAt] = useState(toIstDate(c?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toIstDate(c?.endsAt ?? null));
  const [usageLimit, setUsageLimit] = useState(c?.usageLimit ? String(c.usageLimit) : "");
  const [perCustomerLimit, setPerCustomerLimit] = useState(c?.perCustomerLimit ? String(c.perCustomerLimit) : "");
  const [restrictedUser, setRestrictedUser] = useState<{ id: string; label: string } | null>(
    c?.restrictedToUser
      ? { id: c.restrictedToUser.id, label: `${c.restrictedToUser.name} (${c.restrictedToUser.email})` }
      : null
  );
  const [pickingCustomer, setPickingCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [allComics, setAllComics] = useState(c?.allComics ?? true);
  const [comicIds, setComicIds] = useState<string[]>(c?.comics.map((comic) => comic.id) ?? []);
  const [allCountries, setAllCountries] = useState((c?.countryCodes.length ?? 0) === 0);
  const [countryCodes, setCountryCodes] = useState<string[]>(c?.countryCodes ?? []);
  const [allCovers, setAllCovers] = useState((c?.coverTypes.length ?? 0) === 0);
  const [coverTypes, setCoverTypes] = useState<CoverType[]>(c?.coverTypes ?? []);
  const [combinable, setCombinable] = useState(c?.combinable ?? false);
  const [showAtCheckout, setShowAtCheckout] = useState(c?.showAtCheckout ?? false);
  const [firstOrderOnly, setFirstOrderOnly] = useState(c?.firstOrderOnly ?? false);
  const [isActive, setIsActive] = useState(c?.isActive ?? true);
  const [codeLength, setCodeLength] = useState("8");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set by the first press of the save button when something risky needs a second look.
  const [riskShown, setRiskShown] = useState(false);
  // Set by the first press of the save button; empty required fields only show an error from then on.
  const [submitted, setSubmitted] = useState(false);

  const { data: countries } = useCountries();
  const currencyOptions = [
    ...new Set([...(countries ?? []).map((country) => country.currencyCode), ...(currency ? [currency] : [])]),
  ].sort();
  const { data: comics } = useComics();
  const { data: customerResults } = useCouponCustomerSearch(pickingCustomer ? customerSearch : "");

  // Dates are checked as they are typed. A date the coupon already had is left alone,
  // so a running coupon (whose start is in the past) can still be edited.
  const today = todayInIst();
  const startChanged = startsAt !== toIstDate(c?.startsAt ?? null);
  const endChanged = endsAt !== toIstDate(c?.endsAt ?? null);
  const startError =
    startsAt && startChanged && startsAt < today
      ? "The start date cannot be before today."
      : startsAt && endsAt && startsAt > endsAt
        ? "The start date cannot be after the end date."
        : null;
  const endError =
    endsAt && endChanged && endsAt < today
      ? "The end date cannot be in the past."
      : startsAt && endsAt && endsAt < startsAt
        ? "The end date cannot be before the start date."
        : null;

  // An expired coupon is switched off automatically; giving it a new end date should bring it back.
  const expiredAndOff = isEdit && c !== null && !c.isActive && couponStatus(c) === "expired";

  const needsCurrency = discountType === "FIXED" || (discountType === "PERCENT" && maxDiscount.trim() !== "");
  const isSingleUse = kind === "SINGLE_USE";
  const showAtCheckoutLocked = isSingleUse || restrictedUser !== null;
  const usedCount = (c?.usage.redeemed ?? 0) + (c?.usage.reserved ?? 0);

  // Settings that could cost money if they are a slip of the finger. On edit, only what is
  // being changed counts, so saving a coupon untouched never raises a warning.
  const percentChanged =
    !isEdit ||
    discountType !== c?.discountType ||
    percentOff !== (c?.percentOff ? String(parseFloat(c.percentOff)) : "");
  const openEndedChanged =
    !isEdit ||
    kind !== c?.kind ||
    usageLimit !== (c?.usageLimit ? String(c.usageLimit) : "") ||
    endsAt !== toIstDate(c?.endsAt ?? null) ||
    (restrictedUser?.id ?? null) !== (c?.restrictedToUserId ?? null);
  const riskNotes: string[] = [];
  if (percentChanged && discountType === "PERCENT" && Number(percentOff) >= 50) {
    riskNotes.push(`This takes ${Number(percentOff)}% off the price.`);
  }
  if (openEndedChanged && !isSingleUse && !usageLimit.trim() && !endsAt && !restrictedUser) {
    riskNotes.push("Anyone with this code can use it any number of times, and it never expires.");
  }

  // Plain-words checks on every field. An empty required field only shows after the first save press.
  const isPercent = discountType === "PERCENT";
  const fieldErrors = {
    code: validateCode(code, isEdit ? (initialData?.code ?? null) : null),
    name: validateName(name),
    description: validateDescription(description),
    percentOff: isPercent ? validatePercent(percentOff, true) : null,
    maxDiscount: isPercent ? validateMoney(maxDiscount, "Max discount", false) : null,
    amountOff: isPercent ? null : validateMoney(amountOff, "Amount off", true),
    currency: needsCurrency && !currency ? "Choose a currency for this coupon." : null,
    usageLimit: isSingleUse ? null : validateLimit(usageLimit, "Max uses"),
    perCustomerLimit: validatePerCustomer(perCustomerLimit, usageLimit, isSingleUse, firstOrderOnly),
  };
  const emptyRequired = { name: name.trim() === "", percentOff: percentOff.trim() === "", amountOff: amountOff.trim() === "", currency: true };
  const shown = (field: keyof typeof fieldErrors): string | null => {
    const message = fieldErrors[field];
    if (!message) return null;
    const isEmptyRequired = field in emptyRequired && emptyRequired[field as keyof typeof emptyRequired];
    return submitted || !isEmptyRequired ? message : null;
  };
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
  const fieldProps = (field: keyof typeof fieldErrors, id: string) => ({
    "aria-invalid": shown(field) ? true : undefined,
    "aria-describedby": shown(field) ? `${id}-error` : undefined,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);
    setSubmitted(true);

    if (hasFieldErrors) {
      setErrorMessage("Please fix the fields marked in red.");
      return;
    }
    if (startError || endError) {
      setErrorMessage("Please fix the dates marked in red.");
      return;
    }
    if (!allComics && comicIds.length === 0) {
      setErrorMessage("Choose at least one book, or switch Books to All.");
      return;
    }
    if (!allCountries && countryCodes.length === 0) {
      setErrorMessage("Choose at least one country, or switch Countries to All.");
      return;
    }
    if (!allCovers && coverTypes.length === 0) {
      setErrorMessage("Choose at least one cover type, or switch Cover types to All.");
      return;
    }
    if (riskNotes.length > 0 && !riskShown) {
      setRiskShown(true);
      return;
    }

    // On create an empty optional field is left out; on edit it is sent as null
    // so the server clears it.
    const orNull = <T,>(value: T | null): T | null | undefined =>
      isEdit ? value : value === null ? undefined : value;
    const clearable = (text: string) => orNull(text.trim() === "" ? null : text.trim());

    const shared = {
      name: name.trim(),
      description: clearable(description),
      discountType,
      percentOff: orNull(isPercent ? numberOrNull(percentOff) : null),
      amountOff: orNull(isPercent ? null : numberOrNull(amountOff)),
      maxDiscount: orNull(isPercent ? numberOrNull(maxDiscount) : null),
      currency: clearable(currency),
      startsAt: orNull(startsAt || null),
      endsAt: orNull(endsAt || null),
      // A first-order coupon is once per customer: an empty field on create means 1.
      perCustomerLimit: orNull(
        firstOrderOnly && !isEdit && perCustomerLimit.trim() === "" ? 1 : numberOrNull(perCustomerLimit)
      ),
      restrictedToUserId: orNull(restrictedUser?.id ?? null),
      allComics,
      comicIds: allComics ? [] : comicIds,
      countryCodes: allCountries ? [] : countryCodes,
      coverTypes: allCovers ? [] : coverTypes,
      combinable,
      // Never sent as true for a single-use code or a one-customer coupon (the server refuses it).
      showAtCheckout: showAtCheckout && !isSingleUse && !restrictedUser,
      firstOrderOnly,
      isActive,
    };

    setIsSubmitting(true);
    try {
      // Create: send a code only if one was typed. Edit: only if it changed.
      const typedCode = code.trim();
      const codeField =
        typedCode && typedCode !== (isEdit ? initialData?.code : "") ? { code: typedCode } : {};
      await onSave({
        ...shared,
        ...codeField,
        // Only used when the code field is left empty.
        ...(!isEdit && !typedCode ? { codeLength: Number(codeLength) } : {}),
        kind,
        // A single-use code is always one use in total.
        usageLimit: isSingleUse ? 1 : orNull(numberOrNull(usageLimit)),
      });
      onClose();
    } catch (err) {
      setErrorMessage(friendlyServerMessage(getErrorMessage(err, "Failed to save coupon")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountUnit = currency ? ` (${currency})` : "";

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
        <FormSection title="Coupon">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="coupon-code">Code</label>
              <Input
                id="coupon-code"
                value={code}
                onChange={(e) => setCode(sanitizeCode(e.target.value))}
                placeholder={isEdit ? "" : "Leave empty to generate one"}
                maxLength={CODE_MAX}
                disabled={isEdit && usedCount > 0}
                className="h-10 font-mono uppercase"
                {...fieldProps("code", "coupon-code")}
              />
              <FieldError id="coupon-code-error" message={shown("code")} />
              {!shown("code") && !(isEdit && usedCount > 0) && (
                <p className={hintClass}>{CODE_MIN} to {CODE_MAX} letters, digits or hyphens.</p>
              )}
              {isEdit && usedCount > 0 && (
                <p className={hintClass}>This code has been used, so it cannot be changed.</p>
              )}
              {!isEdit && code.trim() === "" && (
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-[13px] font-semibold text-neutral-700" htmlFor="coupon-code-length">
                    Generated code length
                  </label>
                  <select
                    id="coupon-code-length"
                    className="h-10 sm:h-8 rounded-lg border border-input bg-white px-2 text-sm font-medium"
                    value={codeLength}
                    onChange={(e) => setCodeLength(e.target.value)}
                  >
                    {Array.from({ length: CODE_MAX - CODE_MIN + 1 }, (_, i) => i + CODE_MIN).map((length) => (
                      <option key={length} value={String(length)}>
                        {length} characters
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="coupon-name">Name (internal label)</label>
              <Input id="coupon-name" className="h-10" value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX} {...fieldProps("name", "coupon-name")} />
              <FieldError id="coupon-name-error" message={shown("name")} />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-description">Description (optional)</label>
            <Input id="coupon-description" className="h-10" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={DESCRIPTION_MAX} {...fieldProps("description", "coupon-description")} />
            <FieldError id="coupon-description-error" message={shown("description")} />
          </div>
          <div className="max-w-xs">
            <label className={labelClass} htmlFor="coupon-kind">Type of code</label>
            <select id="coupon-kind" className={selectClass} value={kind} onChange={(e) => setKind(e.target.value as CouponKind)}>
              <option value="PUBLIC">Anyone with the code</option>
              <option value="SINGLE_USE">Works once in total (single use)</option>
            </select>
            {restrictedUser && <p className={hintClass}>Only this customer can use it.</p>}
          </div>
        </FormSection>

        <FormSection title="Discount">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="coupon-discount-type">Discount type</label>
              <select
                id="coupon-discount-type"
                className={selectClass}
                value={discountType}
                onChange={(e) => {
                  const next = e.target.value as CouponDiscountType;
                  setDiscountType(next);
                  // A leftover currency would quietly limit a percentage coupon to that currency.
                  if (next === "PERCENT" && maxDiscount.trim() === "") setCurrency("");
                }}
              >
                <option value="PERCENT">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
            </div>
            {discountType === "PERCENT" ? (
              <>
                <div>
                  <label className={labelClass} htmlFor="coupon-percent">Percent off</label>
                  <Input id="coupon-percent" className="h-10" inputMode="decimal" value={percentOff} onChange={(e) => setPercentOff(sanitizeDecimal(e.target.value))} placeholder="e.g. 20" {...fieldProps("percentOff", "coupon-percent")} />
                  <FieldError id="coupon-percent-error" message={shown("percentOff")} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="coupon-max">Max discount{amountUnit}</label>
                  <Input id="coupon-max" className="h-10" placeholder="Optional" inputMode="decimal" value={maxDiscount} onChange={(e) => {
                      const next = sanitizeDecimal(e.target.value);
                      setMaxDiscount(next);
                      if (next.trim() === "") setCurrency("");
                    }} {...fieldProps("maxDiscount", "coupon-max")} />
                  <FieldError id="coupon-max-error" message={shown("maxDiscount")} />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="coupon-amount">Amount off{amountUnit}</label>
                <Input id="coupon-amount" className="h-10" inputMode="decimal" value={amountOff} onChange={(e) => setAmountOff(sanitizeDecimal(e.target.value))} {...fieldProps("amountOff", "coupon-amount")} />
                <FieldError id="coupon-amount-error" message={shown("amountOff")} />
              </div>
            )}
          </div>
          <p className={hintClass}>Customers always pay at least {PAYMENT_MINIMUM.toFixed(2)}, even with a 100% discount.</p>
          <div>
            <label className={labelClass} htmlFor="coupon-currency">
              Currency{needsCurrency ? "" : " (optional)"}
            </label>
            <div className="max-w-xs">
              <select id="coupon-currency" className={selectClass} value={currency} onChange={(e) => setCurrency(e.target.value)} {...fieldProps("currency", "coupon-currency")}>
                <option value="">{needsCurrency ? "Choose a currency" : "Any currency"}</option>
                {currencyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <FieldError id="coupon-currency-error" message={shown("currency")} />
            <p className={hintClass}>
              {discountType === "FIXED"
                ? "The amount off is in this currency, and the coupon only works on orders in it."
                : maxDiscount.trim() !== ""
                  ? "The maximum discount is in this currency, and the coupon only works on orders in it."
                  : "Leave on Any currency to work in every country, or choose one to limit the coupon to orders in it."}
            </p>
            {needsCurrency && (
              <p className={hintClass}>
                A coupon has one currency. To offer the same deal in another currency, create a second coupon with its own code.
              </p>
            )}
          </div>
        </FormSection>

        <FormSection title="When it works">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="coupon-starts">Starts (optional)</label>
              <Input
                id="coupon-starts"
                className="h-10"
                type="date"
                value={startsAt}
                min={today}
                max={endsAt || undefined}
                onChange={(e) => setStartsAt(e.target.value)}
                aria-invalid={startError ? true : undefined}
                aria-describedby={startError ? "coupon-starts-error" : undefined}
              />
              {startError && <p id="coupon-starts-error" role="alert" className="text-[13px] font-medium text-red-700 mt-1">{startError}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="coupon-ends">Ends (optional)</label>
              <Input
                id="coupon-ends"
                className="h-10"
                type="date"
                value={endsAt}
                min={startsAt && startsAt > today ? startsAt : today}
                onChange={(e) => {
                  setEndsAt(e.target.value);
                  if (expiredAndOff && e.target.value >= today) setIsActive(true);
                }}
                aria-invalid={endError ? true : undefined}
                aria-describedby={endError ? "coupon-ends-error" : undefined}
              />
              {endError && <p id="coupon-ends-error" role="alert" className="text-[13px] font-medium text-red-700 mt-1">{endError}</p>}
              {expiredAndOff && !endError && (
                <p className={hintClass}>
                  This coupon expired and was switched off. Choosing a new end date switches it back on.
                </p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="coupon-limit">Max uses, everyone</label>
              <Input
                id="coupon-limit"
                className="h-10"
                placeholder="No limit"
                inputMode="numeric"
                value={isSingleUse ? "1" : usageLimit}
                onChange={(e) => setUsageLimit(sanitizeInteger(e.target.value))}
                disabled={isSingleUse}
                {...fieldProps("usageLimit", "coupon-limit")}
              />
              <FieldError id="coupon-limit-error" message={shown("usageLimit")} />
              {isSingleUse && <p className={hintClass}>A single-use code works once.</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="coupon-per-customer">Max uses per customer</label>
              <Input id="coupon-per-customer" className="h-10" placeholder={firstOrderOnly ? "1" : "No limit"} inputMode="numeric" value={perCustomerLimit} onChange={(e) => setPerCustomerLimit(sanitizeInteger(e.target.value))} {...fieldProps("perCustomerLimit", "coupon-per-customer")} />
              <FieldError id="coupon-per-customer-error" message={shown("perCustomerLimit")} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Who and where">
          <div>
            <span className={labelClass}>Customer</span>
            {restrictedUser ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#914A8C]/30 bg-white px-3 py-2 text-sm font-medium">
                <span className="truncate">Only {restrictedUser.label}</span>
                <button type="button" className="shrink-0 min-h-10 px-2 text-[13px] font-bold text-red-700 cursor-pointer" onClick={() => setRestrictedUser(null)}>
                  Allow everyone
                </button>
              </div>
            ) : pickingCustomer ? (
              <div className="space-y-2">
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name or email"
                  aria-label="Search customers"
                  autoFocus
                  className="h-10"
                />
                {customerSearch.trim().length >= 2 &&
                  (customerResults?.length ? (
                    <ul className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
                      {customerResults.map((customer) => (
                        <li key={customer.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2.5 min-h-10 text-sm hover:bg-[#914A8C]/5 cursor-pointer"
                            onClick={() => {
                              setRestrictedUser({ id: customer.id, label: `${customer.name} (${customer.email})` });
                              setPickingCustomer(false);
                            }}
                          >
                            <span className="font-semibold">{customer.name}</span>{" "}
                            <span className="text-neutral-500">{customer.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={hintClass}>No registered account matches. Ask the customer to sign up first.</p>
                  ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-neutral-700">Anyone with the code can use it</span>
                <Button type="button" variant="outline" className="h-10 sm:h-8 rounded-lg text-[13px] cursor-pointer" onClick={() => setPickingCustomer(true)}>
                  Limit to one customer
                </Button>
              </div>
            )}
          </div>

          <ScopePicker
            label="Books"
            allText="All books"
            selectedText="Selected books"
            all={allComics}
            onAllChange={setAllComics}
            options={(comics ?? []).map((comic) => ({ value: comic.id, label: comic.title }))}
            selected={comicIds}
            onSelectedChange={setComicIds}
          />
          <ScopePicker
            label="Countries"
            allText="All countries"
            selectedText="Selected countries"
            all={allCountries}
            onAllChange={setAllCountries}
            options={(countries ?? []).map((country) => ({ value: country.code, label: country.name }))}
            selected={countryCodes}
            onSelectedChange={setCountryCodes}
          />
          <ScopePicker
            label="Cover types"
            allText="All covers"
            selectedText="Selected covers"
            all={allCovers}
            onAllChange={setAllCovers}
            options={COVER_OPTIONS}
            selected={coverTypes}
            onSelectedChange={(values) => setCoverTypes(values as CoverType[])}
          />
        </FormSection>

        <FormSection title="Options">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 min-h-10 text-sm font-semibold cursor-pointer">
              <Switch checked={combinable} onCheckedChange={setCombinable} aria-describedby="coupon-combinable-hint" className="data-[state=checked]:bg-[#914A8C]" />
              Can be combined with other offers
            </label>
            <label className="flex items-center gap-2 min-h-10 text-sm font-semibold cursor-pointer">
              <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-[#914A8C]" />
              Active
            </label>
          </div>
          <p id="coupon-combinable-hint" className={hintClass}>
            Not used yet: it has no effect until there is a second kind of discount.
          </p>
          <div className="mt-1">
            <label className={`flex items-center gap-2 min-h-10 text-sm font-semibold ${showAtCheckoutLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
              <Switch
                checked={showAtCheckout && !showAtCheckoutLocked}
                onCheckedChange={setShowAtCheckout}
                disabled={showAtCheckoutLocked}
                aria-describedby="coupon-show-hint"
                className="data-[state=checked]:bg-[#914A8C]"
              />
              Show to customers at checkout
            </label>
            <p id="coupon-show-hint" className={hintClass}>
              {isSingleUse
                ? "A single-use code cannot be shown to everyone."
                : restrictedUser
                  ? "A coupon for one customer is shown to that customer automatically."
                  : "Customers see this offer on their checkout page. Leave off for private codes."}
            </p>
          </div>
          <div className="mt-1">
            <label className="flex items-center gap-2 min-h-10 text-sm font-semibold cursor-pointer">
              <Switch checked={firstOrderOnly} onCheckedChange={setFirstOrderOnly} aria-describedby="coupon-first-order-hint" className="data-[state=checked]:bg-[#914A8C]" />
              Only for a customer&apos;s first order
            </label>
            <p id="coupon-first-order-hint" className={hintClass}>
              Customers who already have a paid order cannot use it. It can be used once per customer.
            </p>
          </div>
        </FormSection>

      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0 flex-col gap-2 rounded-none border-t border-neutral-200 bg-white px-6 py-3 sm:flex-col">
        {riskShown && riskNotes.length > 0 && (
          <div role="alert" className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div className="text-[13px] font-semibold leading-relaxed">
              <p className="font-bold">Please check before saving:</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                {riskNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p className="mt-1">Press the button again to save as it is.</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[13px] font-semibold">
            {errorMessage}
          </div>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl h-11 sm:h-10 px-5 font-semibold cursor-pointer">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold h-11 sm:h-10 px-6 flex items-center justify-center gap-2 cursor-pointer">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {riskShown && riskNotes.length > 0 ? "Save anyway" : isEdit ? "Save changes" : "Create coupon"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function CouponModal({ open, onOpenChange, mode, initialData, onSave }: CouponModalProps) {
  const title = mode === "edit" ? "Edit Coupon" : "Add Coupon";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 overflow-hidden bg-white rounded-2xl p-0">
        <DialogHeader className="space-y-1 px-6 pt-6 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#914A8C] text-[#FFD54A] flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">{title}</DialogTitle>
              <DialogDescription className="text-[13px] text-neutral-600 font-medium">
                Dates are in Indian time. An end date lasts until the end of that day.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {open && (
          <CouponForm mode={mode} initialData={initialData} onSave={onSave} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
