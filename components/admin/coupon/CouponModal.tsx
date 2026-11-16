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
import { Loader2, Ticket } from "lucide-react";
import type {
  Coupon,
  CouponDiscountType,
  CouponInput,
  CouponKind,
  CoverType,
  GenerateCouponsInput,
} from "@/app/types/coupon";
import { useCountries } from "@/hooks/useCountries";
import { useComics } from "@/hooks/useComics";
import { useAdminCustomers } from "@/hooks/useAdminCustomers";
import { getErrorMessage } from "@/lib/utils";
import { toIstDate } from "./couponFormat";

export type CouponModalMode = "create" | "edit" | "generate";

interface CouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: CouponModalMode;
  initialData: Coupon | null;
  onSave: (payload: CouponInput | GenerateCouponsInput) => Promise<void>;
}

const COVER_TYPES: CoverType[] = ["HARDCOVER", "SOFTCOVER"];

const labelClass = "block text-xs font-bold uppercase tracking-wide text-[#914A8C] mb-1.5";
const selectClass =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm font-medium focus:outline-none focus:border-[#914A8C]";

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

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
  const isGenerate = mode === "generate";

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
  const [countryCodes, setCountryCodes] = useState<string[]>(c?.countryCodes ?? []);
  const [coverTypes, setCoverTypes] = useState<CoverType[]>(c?.coverTypes ?? []);
  const [combinable, setCombinable] = useState(c?.combinable ?? false);
  const [isActive, setIsActive] = useState(c?.isActive ?? true);
  const [count, setCount] = useState("10");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: countries } = useCountries();
  const { data: comics } = useComics();
  const { data: customerResults } = useAdminCustomers(
    pickingCustomer && customerSearch.trim().length >= 2
      ? { search: customerSearch.trim(), pageSize: 5 }
      : { pageSize: 1 }
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

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
      countryCodes,
      coverTypes,
      combinable,
      isActive,
    };

    setIsSubmitting(true);
    try {
      if (isGenerate) {
        await onSave({ ...shared, count: Number(count) } as GenerateCouponsInput);
      } else {
        await onSave({
          ...shared,
          ...(isEdit ? {} : code.trim() ? { code: code.trim() } : {}),
          ...(isEdit && code.trim() !== initialData?.code ? { code: code.trim() } : {}),
          kind,
          usageLimit: orNull(numberOrNull(usageLimit)),
        } as CouponInput);
      }
      onClose();
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Failed to save coupon"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsCurrency = discountType === "FIXED" || (discountType === "PERCENT" && maxDiscount.trim() !== "");

  return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isGenerate ? (
              <div>
                <label className={labelClass} htmlFor="coupon-count">How many codes</label>
                <Input id="coupon-count" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
              </div>
            ) : (
              <div>
                <label className={labelClass} htmlFor="coupon-code">Code</label>
                <Input
                  id="coupon-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={isEdit ? "" : "Leave empty to generate one"}
                  maxLength={32}
                  className="font-mono uppercase"
                />
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="coupon-name">Name (for you)</label>
              <Input id="coupon-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="coupon-description">Description (optional)</label>
            <Input id="coupon-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </div>

          {/* Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="coupon-discount-type">Discount type</label>
              <select
                id="coupon-discount-type"
                className={selectClass}
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
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
                  <label className={labelClass} htmlFor="coupon-max">Max discount (optional)</label>
                  <Input id="coupon-max" inputMode="decimal" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="coupon-amount">Amount off</label>
                <Input id="coupon-amount" inputMode="decimal" value={amountOff} onChange={(e) => setAmountOff(e.target.value)} />
              </div>
            )}
          </div>
          {needsCurrency && (
            <div className="max-w-[12rem]">
              <label className={labelClass} htmlFor="coupon-currency">Currency</label>
              <Input
                id="coupon-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="INR"
                maxLength={3}
                className="font-mono uppercase"
              />
              <p className="text-xs text-neutral-500 mt-1">Amounts only apply to orders in this currency.</p>
            </div>
          )}

          {/* Validity and limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="coupon-starts">Starts (optional)</label>
              <Input id="coupon-starts" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="coupon-ends">Ends (optional)</label>
              <Input id="coupon-ends" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
            {!isGenerate && (
              <div>
                <label className={labelClass} htmlFor="coupon-limit">Total uses (optional)</label>
                <Input id="coupon-limit" inputMode="numeric" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="coupon-per-customer">Uses per customer (optional)</label>
              <Input id="coupon-per-customer" inputMode="numeric" value={perCustomerLimit} onChange={(e) => setPerCustomerLimit(e.target.value)} />
            </div>
            {!isGenerate && (
              <div>
                <label className={labelClass} htmlFor="coupon-kind">Kind</label>
                <select id="coupon-kind" className={selectClass} value={kind} onChange={(e) => setKind(e.target.value as CouponKind)}>
                  <option value="PUBLIC">Public code</option>
                  <option value="SINGLE_USE">Single use</option>
                </select>
              </div>
            )}
          </div>

          {/* Audience */}
          <div>
            <span className={labelClass}>Only for one customer (optional)</span>
            {restrictedUser ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#914A8C]/30 bg-[#914A8C]/5 px-3 py-2 text-sm font-medium">
                <span className="truncate">{restrictedUser.label}</span>
                <button type="button" className="text-xs font-bold text-red-600 cursor-pointer" onClick={() => setRestrictedUser(null)}>
                  Remove
                </button>
              </div>
            ) : pickingCustomer ? (
              <div className="space-y-2">
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name or email"
                  aria-label="Search customers"
                />
                {customerSearch.trim().length >= 2 &&
                  (customerResults?.customers.length ? (
                    <ul className="rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                      {customerResults.customers.map((customer) => (
                        <li key={customer.userId}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-[#914A8C]/5 cursor-pointer"
                            onClick={() => {
                              setRestrictedUser({ id: customer.userId, label: `${customer.name} (${customer.email})` });
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
                    <p className="text-xs text-neutral-500">No customers found. Only customers with a paid order are listed.</p>
                  ))}
              </div>
            ) : (
              <Button type="button" variant="outline" className="h-9 rounded-lg cursor-pointer" onClick={() => setPickingCustomer(true)}>
                Choose a customer
              </Button>
            )}
          </div>

          {/* Scope */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={allComics} onCheckedChange={setAllComics} className="data-[state=checked]:bg-[#914A8C]" aria-label="All comics" />
              <span className="text-sm font-semibold">All comics</span>
            </div>
            {!allComics && (
              <div className="max-h-36 overflow-y-auto rounded-lg border border-neutral-200 p-2 space-y-1">
                {(comics ?? []).map((comic) => (
                  <label key={comic.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={comicIds.includes(comic.id)} onChange={() => setComicIds(toggleIn(comicIds, comic.id))} />
                    {comic.title}
                  </label>
                ))}
              </div>
            )}
            <div>
              <span className={labelClass}>Countries (none ticked = all)</span>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {(countries ?? []).map((country) => (
                  <label key={country.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={countryCodes.includes(country.code)} onChange={() => setCountryCodes(toggleIn(countryCodes, country.code))} />
                    {country.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className={labelClass}>Cover types (none ticked = all)</span>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {COVER_TYPES.map((cover) => (
                  <label key={cover} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
                    <input type="checkbox" checked={coverTypes.includes(cover)} onChange={() => setCoverTypes(toggleIn(coverTypes, cover))} />
                    {cover.toLowerCase()}
                  </label>
                ))}
              </div>
            </div>
          </div>

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
              {isGenerate ? "Generate" : isEdit ? "Save changes" : "Create coupon"}
            </Button>
          </DialogFooter>
        </form>
  );
}

export function CouponModal({ open, onOpenChange, mode, initialData, onSave }: CouponModalProps) {
  const title = mode === "generate" ? "Generate Codes" : mode === "edit" ? "Edit Coupon" : "Add Coupon";

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
                {mode === "generate"
                  ? "Create many single-use codes with the same discount."
                  : "Dates are in Indian time. An end date lasts until the end of that day."}
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
