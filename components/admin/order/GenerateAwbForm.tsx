"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirmDimensions } from "@/hooks/useOrders";
import type { AdminOrderDetail } from "@/app/types/order";
import {
  awbFormSchema,
  DEFAULT_DIMENSIONS,
  type AwbFormValues,
} from "./awbFormSchema";
import { GenerateAwbConfirmModal } from "./GenerateAwbConfirmModal";

export function GenerateAwbForm({ order }: { order: AdminOrderDetail }) {
  const { mutateAsync, isPending } = useConfirmDimensions(order.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The backend saves dimensions BEFORE calling Shiprocket, so a Phase B that
  // failed partway leaves the admin's typed values on the order. Prefer those
  // over the defaults — otherwise a retry silently discards what they entered.
  const { dimensions } = order;
  const defaultValues: AwbFormValues = {
    length: dimensions.finalLength ?? DEFAULT_DIMENSIONS.length,
    breadth: dimensions.finalBreadth ?? DEFAULT_DIMENSIONS.breadth,
    height: dimensions.finalHeight ?? DEFAULT_DIMENSIONS.height,
    weight: dimensions.finalWeight ?? DEFAULT_DIMENSIONS.weight,
  };

  const form = useForm<AwbFormValues>({
    resolver: zodResolver(awbFormSchema),
    defaultValues,
  });

  // Only runs once Zod has passed, so the modal always echoes valid values.
  const openConfirm = () => {
    setErrorMessage(null);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      const result = await mutateAsync(form.getValues());
      setConfirmOpen(false);
      toast.success(
        `AWB ${result.awbCode} assigned via ${result.courierName}${
          result.pickupScheduledDate
            ? ` — pickup ${new Date(result.pickupScheduledDate).toLocaleDateString()}`
            : ""
        }`
      );
    } catch (err) {
      const { message } = (err ?? {}) as { code?: string; message?: string };
      setErrorMessage(message ?? "Shiprocket rejected the request. Please try again.");
    }
  };

  const fields = [
    { name: "length" as const, label: "Length (cm)", step: "0.1" },
    { name: "breadth" as const, label: "Breadth (cm)", step: "0.1" },
    { name: "height" as const, label: "Height (cm)", step: "0.1" },
    { name: "weight" as const, label: "Weight (kg)", step: "0.01" },
  ];

  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-5">
      <h3 className="font-bold text-neutral-900 mb-1">Generate AWB</h3>
      <p className="text-sm text-neutral-600 mb-4">
        Measure the packed book and confirm. This pushes the real dimensions to Shiprocket,
        assigns a courier, and schedules the pickup.
      </p>

      <form onSubmit={form.handleSubmit(openConfirm)} className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name} className="text-xs font-semibold text-neutral-700">
                {field.label}
              </Label>
              <Input
                id={field.name}
                type="number"
                step={field.step}
                inputMode="decimal"
                disabled={isPending}
                className="h-10 rounded-xl bg-white border-neutral-200"
                {...form.register(field.name, { valueAsNumber: true })}
              />
              {form.formState.errors[field.name] && (
                <p className="text-[11px] font-semibold text-red-600">
                  {form.formState.errors[field.name]?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold h-11 px-6 shadow-sm"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Contacting Shiprocket…
            </>
          ) : (
            <>
              <Truck className="w-4 h-4 mr-2" /> Generate AWB
            </>
          )}
        </Button>
      </form>

      <GenerateAwbConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        isPending={isPending}
        values={form.getValues()}
        errorMessage={errorMessage}
      />
    </div>
  );
}
