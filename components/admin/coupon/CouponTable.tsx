"use client";

import type { Coupon } from "@/app/types/coupon";
import { Pencil, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { describeDiscount, describeValidity } from "./couponFormat";

interface CouponTableProps {
  coupons: Coupon[];
  togglingId: string | null;
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
  onToggle: (coupon: Coupon) => void;
  onAddFirst: () => void;
}

export function CouponTable({
  coupons,
  togglingId,
  onEdit,
  onDelete,
  onToggle,
  onAddFirst,
}: CouponTableProps) {
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

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#914A8C]/15 shadow-sm overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[860px]">
        <thead>
          <tr className="bg-[#F8E7D2]/40 border-b border-[#914A8C]/15 text-[#914A8C] text-xs uppercase tracking-wider font-bold">
            <th className="p-4">Code</th>
            <th className="p-4">Discount</th>
            <th className="p-4">Valid</th>
            <th className="p-4">Used</th>
            <th className="p-4">Active</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => (
            <tr
              key={coupon.id}
              className="border-b border-[#914A8C]/10 hover:bg-[#F8E7D2]/10 transition-colors"
            >
              <td className="p-4">
                <p className="font-mono font-bold text-neutral-800">{coupon.code}</p>
                <p className="text-xs text-neutral-500 font-medium">
                  {coupon.name}
                  {coupon.kind === "SINGLE_USE" ? " · single use" : ""}
                </p>
              </td>
              <td className="p-4 text-sm font-semibold text-neutral-700">
                {describeDiscount(coupon)}
              </td>
              <td className="p-4 text-sm text-neutral-600">{describeValidity(coupon)}</td>
              <td className="p-4 text-sm font-semibold text-neutral-700">
                {coupon.usage.redeemed}
                {coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : ""}
                {coupon.usage.reserved > 0 && (
                  <span className="block text-xs font-medium text-amber-600">
                    {coupon.usage.reserved} in checkout
                  </span>
                )}
              </td>
              <td className="p-4">
                <Switch
                  checked={coupon.isActive}
                  onCheckedChange={() => onToggle(coupon)}
                  disabled={togglingId === coupon.id}
                  className="data-[state=checked]:bg-[#914A8C]"
                  aria-label={`${coupon.isActive ? "Deactivate" : "Activate"} ${coupon.code}`}
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
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(coupon)}
                    className="h-8 w-8 rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                    title="Delete Coupon"
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
  );
}
