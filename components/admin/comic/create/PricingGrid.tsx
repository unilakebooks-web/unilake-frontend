"use client";

import { useCountries } from "@/hooks/useCountries";
import { CoverType } from "@/app/types/comic";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export interface PricingGridValue {
  countryId: string;
  coverType: CoverType;
  /** Strike-through price shown to customers. Must be >= price. */
  mrp: string;
  /** The price actually charged at checkout. */
  price: string;
}

/** Which of the two money fields a cell edits. */
type PriceField = "mrp" | "price";

interface PricingGridProps {
  values: PricingGridValue[];
  onChange: (values: PricingGridValue[]) => void;
  error?: string;
}

export function PricingGrid({ values, onChange, error }: PricingGridProps) {
  const { data: countries, isLoading, error: fetchError } = useCountries();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900">Pricing Rules</h3>
        <Skeleton className="h-48 w-full rounded-2xl bg-neutral-100" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm">
        Failed to load countries for pricing grid.
      </div>
    );
  }

  if (!countries || countries.length === 0) {
    return (
      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-center flex flex-col items-center">
        <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
        <h3 className="font-bold text-amber-900 mb-1">No Countries Found</h3>
        <p className="text-sm text-amber-700 mb-4 max-w-sm">
          You must create at least one country in the system before you can set pricing and create a comic.
        </p>
        <Link 
          href="/admin/countries"
          className="text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors"
        >
          Go to Countries
        </Link>
      </div>
    );
  }

  const getValue = (
    countryId: string,
    coverType: CoverType,
    field: PriceField
  ) => {
    return (
      values.find((v) => v.countryId === countryId && v.coverType === coverType)?.[
        field
      ] || ""
    );
  };

  /**
   * True when both fields of a row are filled and the MRP is below the selling
   * price — the one combination the backend will reject. Surfaced inline so the
   * admin sees it before submitting rather than as a Zod error afterwards.
   */
  const hasInvertedPrices = (countryId: string, coverType: CoverType) => {
    const mrp = parseFloat(getValue(countryId, coverType, "mrp"));
    const price = parseFloat(getValue(countryId, coverType, "price"));
    if (Number.isNaN(mrp) || Number.isNaN(price)) return false;
    return mrp < price;
  };

  const handleValueChange = (
    countryId: string,
    coverType: CoverType,
    field: PriceField,
    newValue: string
  ) => {
    // Only allow numbers and one decimal point
    if (newValue !== "" && !/^\d*\.?\d*$/.test(newValue)) return;

    const existingIndex = values.findIndex(
      (v) => v.countryId === countryId && v.coverType === coverType
    );
    const newValues = [...values];

    if (existingIndex >= 0) {
      newValues[existingIndex] = {
        ...newValues[existingIndex],
        [field]: newValue,
      };
    } else {
      // New row — seed BOTH fields so the object shape stays complete and the
      // other input stays a controlled component.
      newValues.push({
        countryId,
        coverType,
        mrp: "",
        price: "",
        [field]: newValue,
      });
    }

    onChange(newValues);
  };

  /**
   * One money input. Extracted because the grid now renders four of these per
   * row — MRP and price for each of the two cover types — and inlining them
   * would be the same fifteen lines copied four times.
   */
  const renderPriceCell = (
    country: { id: string; currencyCode: string },
    coverType: CoverType,
    field: PriceField
  ) => {
    const value = getValue(country.id, coverType, field);
    const inverted = hasInvertedPrices(country.id, coverType);
    const isEmptyAndErrored = !value && !!error;

    return (
      <td key={`${coverType}-${field}`} className="px-4 py-2 align-top">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-xs">
            {country.currencyCode}
          </span>
          <Input
            type="text"
            placeholder="0.00"
            value={value}
            onChange={(e) =>
              handleValueChange(country.id, coverType, field, e.target.value)
            }
            className={`pl-12 h-9 rounded-lg bg-white ${
              isEmptyAndErrored || inverted ? "border-red-300 bg-red-50" : ""
            }`}
          />
        </div>
        {/* Shown once per row, under the MRP cell, so the message doesn't
            appear twice for what is a single problem. */}
        {inverted && field === "mrp" && (
          <p className="mt-1 text-[10px] font-semibold text-red-600 leading-tight">
            MRP is below the selling price.
          </p>
        )}
      </td>
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
          Pricing Rules
          {error && <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{error}</span>}
        </h3>
        <p className="text-xs text-neutral-500">
          All countries and cover types are required. MRP is the struck-through
          price shown to customers and must be at least the selling price.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Hardcover MRP</th>
                <th className="px-4 py-3">Hardcover Discounted Price</th>
                <th className="px-4 py-3">Softcover MRP</th>
                <th className="px-4 py-3">Softcover Discounted Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {countries.map((country) => (
                <tr key={country.id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 bg-neutral-200 rounded overflow-hidden shadow-sm shrink-0">
                        {country.flagUrl && (
                          <img src={country.flagUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-900 leading-tight">{country.name}</p>
                        <p className="text-[10px] font-mono text-neutral-500 mt-0.5">{country.currencyCode}</p>
                      </div>
                    </div>
                  </td>
                  {renderPriceCell(country, CoverType.HARDCOVER, "mrp")}
                  {renderPriceCell(country, CoverType.HARDCOVER, "price")}
                  {renderPriceCell(country, CoverType.SOFTCOVER, "mrp")}
                  {renderPriceCell(country, CoverType.SOFTCOVER, "price")}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
