"use client";

import type { Coupon } from "@/app/types/coupon";
import { Copy, Pencil, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { couponStatus, describeDiscount, describeValidity, type CouponStatus } from "./couponFormat";

const STATUS_STYLES: Record<CouponStatus, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  off: "bg-neutral-100 text-neutral-600 border-neutral-200",
  expired: "bg-red-100 text-red-700 border-red-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  "used up": "bg-amber-100 text-amber-800 border-amber-200",
};

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success(`Code ${code} copied`);
  } catch {
    toast.error("Could not copy the code");
  }
}

function StatusBadge({ coupon }: { coupon: Coupon }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${STATUS_STYLES[couponStatus(coupon)]}`}
    >
      {couponStatus(coupon)}
    </span>
  );
}

function usedText(coupon: Coupon) {
  return `${coupon.usage.redeemed}${coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : ""}`;
}

interface CouponTableProps {
  coupons: Coupon[];
  togglingId: string | null;
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
  onToggle: (coupon: Coupon) => void;
  onAddFirst: () => void;
  /** True when a search or filter is active, so an empty list means no match. */
  filtered: boolean;
}

export function CouponTable({
  coupons,
  togglingId,
  onEdit,
  onDelete,
  onToggle,
  onAddFirst,
  filtered,
}: CouponTableProps) {
  if (coupons.length === 0 && filtered) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#914A8C]/25 p-10 text-center shadow-sm">
        <h3 className="text-lg font-bold text-neutral-800 mb-1">No coupons match</h3>
        <p className="text-sm text-neutral-500 font-medium">
          Try a different search, or choose All statuses.
        </p>
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#914A8C]/25 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] mb-4 shadow-inner">
          <Ticket className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 tracking-wide mb-2">
          No Coupons Found
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 font-medium leading-relaxed">
          Create a coupon code that customers can apply at checkout.
        </p>
        <button
          onClick={onAddFirst}
          className="px-6 py-3 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        >
          + Add Coupon
        </button>
      </div>
    );
  }

  const toggleLabel = (coupon: Coupon) => `${coupon.isActive ? "Deactivate" : "Activate"} ${coupon.code}`;

  return (
    <>
      {/* Phones: one card per coupon, so nothing sits off-screen. */}
      <ul className="sm:hidden space-y-3">
        {coupons.map((coupon) => (
          <li
            key={coupon.id}
            className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#914A8C]/15 shadow-sm p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-mono font-bold text-neutral-800">
                  <span className="break-all" title={coupon.code}>{coupon.code}</span>
                  <button
                    type="button"
                    onClick={() => copyCode(coupon.code)}
                    aria-label={`Copy code ${coupon.code}`}
                    title="Copy code"
                    className="shrink-0 h-10 w-10 -my-2 flex items-center justify-center rounded text-neutral-500 hover:text-[#914A8C] hover:bg-[#914A8C]/10 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </p>
                <p className="text-sm text-neutral-600 font-medium break-words" title={coupon.name}>
                  {coupon.name}
                  {coupon.kind === "SINGLE_USE" ? " · single use" : ""}
                </p>
                {coupon.showAtCheckout && <p className="text-xs font-semibold text-[#914A8C]">Shown at checkout</p>}
                {coupon.firstOrderOnly && <p className="text-xs font-semibold text-[#914A8C]">First orders only</p>}
              </div>
              <StatusBadge coupon={coupon} />
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div className="col-span-2">
                <dt className="text-[13px] font-bold uppercase tracking-wide text-neutral-600">Discount</dt>
                <dd className="font-semibold text-neutral-800">{describeDiscount(coupon)}</dd>
              </div>
              <div>
                <dt className="text-[13px] font-bold uppercase tracking-wide text-neutral-600">Valid</dt>
                <dd className="text-neutral-700">{describeValidity(coupon)}</dd>
              </div>
              <div>
                <dt className="text-[13px] font-bold uppercase tracking-wide text-neutral-600">Used</dt>
                <dd className="font-semibold text-neutral-800">
                  {usedText(coupon)}
                  {coupon.usage.reserved > 0 && (
                    <span className="block text-xs font-medium text-amber-700">
                      {coupon.usage.reserved} in checkout
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            <div className="flex items-center justify-between gap-3 border-t border-[#914A8C]/10 pt-3">
              <label className="flex items-center gap-2 min-h-10 text-sm font-semibold text-neutral-700 cursor-pointer">
                <Switch
                  checked={coupon.isActive}
                  onCheckedChange={() => onToggle(coupon)}
                  disabled={togglingId === coupon.id}
                  className="data-[state=checked]:bg-[#914A8C]"
                  aria-label={toggleLabel(coupon)}
                />
                {coupon.isActive ? "On" : "Off"}
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onEdit(coupon)}
                  className="h-10 w-10 rounded-lg text-neutral-600 hover:text-[#914A8C] hover:border-[#914A8C] transition-colors"
                  title="Edit Coupon"
                  aria-label={`Edit coupon ${coupon.code}`}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onDelete(coupon)}
                  className="h-10 w-10 rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                  title="Delete Coupon"
                  aria-label={`Delete coupon ${coupon.code}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden sm:block bg-white/80 backdrop-blur-md rounded-2xl border border-[#914A8C]/15 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[860px]">
          <thead>
            <tr className="bg-[#F8E7D2]/40 border-b border-[#914A8C]/15 text-[#914A8C] text-[13px] uppercase tracking-wider font-bold">
              <th className="p-4">Code</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Valid</th>
              <th className="p-4">Used</th>
              <th className="p-4">Status</th>
              <th className="p-4">On/off</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr
                key={coupon.id}
                className="border-b border-[#914A8C]/10 hover:bg-[#F8E7D2]/10 transition-colors"
              >
                <td className="p-4 max-w-[16rem]">
                  <p className="flex items-center gap-1.5 font-mono font-bold text-neutral-800">
                    <span className="break-all" title={coupon.code}>{coupon.code}</span>
                    <button
                      type="button"
                      onClick={() => copyCode(coupon.code)}
                      aria-label={`Copy code ${coupon.code}`}
                      title="Copy code"
                      className="shrink-0 p-1 rounded text-neutral-400 hover:text-[#914A8C] hover:bg-[#914A8C]/10 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </p>
                  <p className="text-xs text-neutral-600 font-medium break-words" title={coupon.name}>
                    {coupon.name}
                    {coupon.kind === "SINGLE_USE" ? " · single use" : ""}
                  </p>
                  {coupon.showAtCheckout && <p className="text-xs font-semibold text-[#914A8C]">Shown at checkout</p>}
                  {coupon.firstOrderOnly && <p className="text-xs font-semibold text-[#914A8C]">First orders only</p>}
                </td>
                <td className="p-4 text-sm font-semibold text-neutral-700">
                  {describeDiscount(coupon)}
                </td>
                <td className="p-4 text-sm text-neutral-600">{describeValidity(coupon)}</td>
                <td className="p-4 text-sm font-semibold text-neutral-700">
                  {usedText(coupon)}
                  {coupon.usage.reserved > 0 && (
                    <span className="block text-xs font-medium text-amber-700">
                      {coupon.usage.reserved} in checkout
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <StatusBadge coupon={coupon} />
                </td>
                <td className="p-4">
                  <Switch
                    checked={coupon.isActive}
                    onCheckedChange={() => onToggle(coupon)}
                    disabled={togglingId === coupon.id}
                    className="data-[state=checked]:bg-[#914A8C]"
                    aria-label={toggleLabel(coupon)}
                  />
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(coupon)}
                      className="h-8 w-8 rounded-lg text-neutral-600 hover:text-[#914A8C] hover:border-[#914A8C] transition-colors"
                      title="Edit Coupon"
                      aria-label={`Edit coupon ${coupon.code}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(coupon)}
                      className="h-8 w-8 rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                      title="Delete Coupon"
                      aria-label={`Delete coupon ${coupon.code}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
