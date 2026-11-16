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
  CoverType,
} from "@/app/types/coupon";
import { useCountries } from "@/hooks/useCountries";
import { useComics } from "@/hooks/useComics";
import { useCouponCustomerSearch } from "@/hooks/useCoupons";
import { getErrorMessage } from "@/lib/utils";
import { toIstDate, todayInIst } from "./couponFormat";
import { FormSection, ScopePicker, labelClass, selectClass } from "./CouponFormParts";

export type CouponModalMode = "create" | "edit";

interface CouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CouponModalMode;
  initialData: Coupon | null;
  onSave: (payload: CouponInput) => Promise<void>;
}

const COVER_OPTIONS: { value: CoverType; label: string }[] = [
  { value: "HARDCOVER", label: "Hardcover" },
  { value: "SOFTCOVER", label: "Softcover" },
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
  const [isActive, setIsActive] = useState(c?.isActive ?? true);
  const [codeLength, setCodeLength] = useState("8");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set by the first press of the save button when something risky needs a second look.
  const [riskShown, setRiskShown] = useState(false);

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

  const needsCurrency = discountType === "FIXED" || (discountType === "PERCENT" && maxDiscount.trim() !== "");
  const isSingleUse = kind === "SINGLE_USE";
  const usedCount = (c?.usage.redeemed ?? 0) + (c?.usage.reserved ?? 0);

  // Settings that could cost money if they are a slip of the finger.
  const riskNotes: string[] = [];
  if (discountType === "PERCENT" && Number(percentOff) >= 50) {
    riskNotes.push(`This takes ${Number(percentOff)}% off the price.`);
  }
  if (!isSingleUse && !usageLimit.trim() && !endsAt && !restrictedUser) {
    riskNotes.push("Anyone with this code can use it any number of times, and it never expires.");
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    if (startError || endError) {
      setErrorMessage("Please fix the dates marked in red.");
      return;
    }
    if (needsCurrency && !currency) {
      setErrorMessage("Choose a currency for this coupon.");
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

    const isPercent = discountType === "PERCENT";
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
      perCustomerLimit: orNull(numberOrNull(perCustomerLimit)),
      restrictedToUserId: orNull(restrictedUser?.id ?? null),
      allComics,
      comicIds: allComics ? [] : comicIds,
      countryCodes: allCountries ? [] : countryCodes,
      coverTypes: allCovers ? [] : coverTypes,
      combinable,
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
      } as CouponInput);
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Failed to save coupon"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const amountUnit = currency ? ` (${currency})` : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormSection title="Coupon">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="coupon-code">Code</label>
            <Input
              id="coupon-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={isEdit ? "" : "Leave empty to generate one"}
              maxLength={32}
              disabled={isEdit && usedCount > 0}
              className="font-mono uppercase"
            />
            {isEdit && usedCount > 0 && (
              <p className="text-xs text-neutral-500 mt-1">This code has been used, so it cannot be changed.</p>
            )}
            {!isEdit && code.trim() === "" && (
              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs font-semibold text-neutral-600" htmlFor="coupon-code-length">
                  Generated code length
                </label>
                <select
                  id="coupon-code-length"
                  className="h-8 rounded-lg border border-input bg-white px-2 text-sm font-medium"
                  value={codeLength}
                  onChange={(e) => setCodeLength(e.target.value)}
                >
                  {Array.from({ length: 29 }, (_, i) => i + 4).map((length) => (
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
            <Input id="coupon-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="coupon-description">Description (optional)</label>
          <Input id="coupon-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </div>
        <div className="max-w-xs">
          <label className={labelClass} htmlFor="coupon-kind">Type of code</label>
          <select id="coupon-kind" className={selectClass} value={kind} onChange={(e) => setKind(e.target.value as CouponKind)}>
            <option value="PUBLIC">Public code (shared with many)</option>
            <option value="SINGLE_USE">Single-use code (works once)</option>
          </select>
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
                <Input id="coupon-percent" inputMode="decimal" value={percentOff} onChange={(e) => setPercentOff(e.target.value)} placeholder="e.g. 20" />
              </div>
              <div>
                <label className={labelClass} htmlFor="coupon-max">Max discount{amountUnit} (optional)</label>
                <Input id="coupon-max" inputMode="decimal" value={maxDiscount} onChange={(e) => {
                    setMaxDiscount(e.target.value);
                    if (e.target.value.trim() === "") setCurrency("");
                  }} />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="coupon-amount">Amount off{amountUnit}</label>
              <Input id="coupon-amount" inputMode="decimal" value={amountOff} onChange={(e) => setAmountOff(e.target.value)} />
            </div>
          )}
        </div>
        <div className="max-w-xs">
          <label className={labelClass} htmlFor="coupon-currency">
            Currency{needsCurrency ? "" : " (optional)"}
          </label>
          <select id="coupon-currency" className={selectClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="">{needsCurrency ? "Choose a currency" : "Any currency"}</option>
            {currencyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            {discountType === "FIXED"
              ? "The amount off is in this currency, and the coupon only works on orders in it."
              : maxDiscount.trim() !== ""
                ? "The maximum discount is in this currency, and the coupon only works on orders in it."
                : "Leave on Any currency to work in every country, or choose one to limit the coupon to orders in it."}
          </p>
          {needsCurrency && (
            <p className="text-xs text-neutral-500 mt-1">
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
              type="date"
              value={startsAt}
              min={today}
              max={endsAt || undefined}
              onChange={(e) => setStartsAt(e.target.value)}
              aria-invalid={startError ? true : undefined}
            />
            {startError && <p role="alert" className="text-xs font-medium text-red-600 mt-1">{startError}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-ends">Ends (optional)</label>
            <Input
              id="coupon-ends"
              type="date"
              value={endsAt}
              min={startsAt && startsAt > today ? startsAt : today}
              onChange={(e) => setEndsAt(e.target.value)}
              aria-invalid={endError ? true : undefined}
            />
            {endError && <p role="alert" className="text-xs font-medium text-red-600 mt-1">{endError}</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-limit">Max uses, all customers (optional)</label>
            <Input
              id="coupon-limit"
              inputMode="numeric"
              value={isSingleUse ? "1" : usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              disabled={isSingleUse}
            />
            {isSingleUse && <p className="text-xs text-neutral-500 mt-1">A single-use code works once.</p>}
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-per-customer">Max uses per customer (optional)</label>
            <Input id="coupon-per-customer" inputMode="numeric" value={perCustomerLimit} onChange={(e) => setPerCustomerLimit(e.target.value)} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Who and where">
        <div>
          <span className={labelClass}>Customer</span>
          {restrictedUser ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#914A8C]/30 bg-white px-3 py-2 text-sm font-medium">
              <span className="truncate">Only {restrictedUser.label}</span>
              <button type="button" className="text-xs font-bold text-red-600 cursor-pointer" onClick={() => setRestrictedUser(null)}>
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
              />
              {customerSearch.trim().length >= 2 &&
                (customerResults?.length ? (
                  <ul className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
                    {customerResults.map((customer) => (
                      <li key={customer.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[#914A8C]/5 cursor-pointer"
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
                  <p className="text-xs text-neutral-500">No registered account matches. Ask the customer to sign up first.</p>
                ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-neutral-700">Everyone can use it</span>
              <Button type="button" variant="outline" className="h-8 rounded-lg text-xs cursor-pointer" onClick={() => setPickingCustomer(true)}>
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
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <Switch checked={combinable} onCheckedChange={setCombinable} className="data-[state=checked]:bg-[#914A8C]" />
            Can be combined with other offers
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
            <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-[#914A8C]" />
            Active
          </label>
        </div>
      </FormSection>

      {riskShown && riskNotes.length > 0 && (
        <div role="alert" className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <div className="text-xs font-semibold leading-relaxed">
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
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      <DialogFooter className="gap-2 pt-3 border-t border-neutral-100">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="rounded-xl h-10 px-5 font-semibold cursor-pointer">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold h-10 px-6 flex items-center gap-2 cursor-pointer">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {riskShown && riskNotes.length > 0 ? "Save anyway" : isEdit ? "Save changes" : "Create coupon"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CouponModal({ open, onOpenChange, mode, initialData, onSave }: CouponModalProps) {
  const title = mode === "edit" ? "Edit Coupon" : "Add Coupon";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#914A8C] text-[#FFD54A] flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">{title}</DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
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
