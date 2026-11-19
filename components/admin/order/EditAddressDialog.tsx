"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useEditOrderAddress } from "@/hooks/useOrders";
import { getErrorMessage } from "@/lib/utils";
import type { AdminOrderDetail, AddressSyncStatus } from "@/app/types/order";
import { buildAddressEditSchema, type AddressEditValues } from "./addressEditSchema";

const FIELDS: { name: keyof AddressEditValues; label: string; inputMode?: "numeric" | "tel" }[] = [
  { name: "name", label: "Recipient name" },
  { name: "line1", label: "Address line 1" },
  { name: "line2", label: "Address line 2 (optional)" },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "zip", label: "Pincode", inputMode: "numeric" },
  { name: "phone", label: "Phone", inputMode: "tel" },
];

function toastForResult(syncStatus: AddressSyncStatus) {
  switch (syncStatus) {
    case "SYNCED":
      return toast.success("Address updated and confirmed at Shiprocket");
    case "NOT_REQUIRED":
      return toast.success("Address updated");
    case "PENDING":
      return toast.warning(
        "Address updated. Shiprocket does not have it yet: use Retry sync in the address history."
      );
    default:
      return toast.warning(
        "Address updated, but Shiprocket does not have it confirmed. Open the address history and use Retry sync."
      );
  }
}

export function EditAddressDialog({
  order,
  open,
  onOpenChange,
}: {
  order: AdminOrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutateAsync, isPending } = useEditOrderAddress(order.id);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { shipping } = order;
  // The newest change this form was filled in from; the dialog mounts when opened, so this
  // is fixed for as long as the form is. A save on top of a newer change is refused.
  const [baseSeq] = useState(() => order.addressHistory?.[0]?.seq ?? 0);

  const form = useForm<AddressEditValues>({
    resolver: zodResolver(buildAddressEditSchema({ country: shipping.country })),
    defaultValues: {
      name: shipping.name ?? "",
      line1: shipping.line1 ?? "",
      line2: shipping.line2 ?? "",
      city: shipping.city ?? "",
      state: shipping.state ?? "",
      zip: shipping.zip ?? "",
      phone: shipping.phone ?? "",
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    try {
      const result = await mutateAsync({ ...values, expectedSeq: baseSeq });
      onOpenChange(false);
      if (!result.changed) {
        if (result.unsynced) {
          toast.warning(
            "Nothing was changed, but an earlier change is still waiting for Shiprocket: use Retry sync in the address history."
          );
        } else {
          toast.info("Nothing was changed");
        }
        return;
      }
      toastForResult(result.syncStatus);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Failed to change the address"));
    }
  });

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={!isPending}
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#914A8C]/20 shadow-xl rounded-2xl p-6"
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#914A8C]/10 text-[#914A8C] flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Change the delivery address
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                The old address stays in the history. The new one is sent to Shiprocket, and
                the Bill of Supply shows it from now on. The country cannot be changed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3 mt-2">
          {FIELDS.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={`address-${field.name}`} className="text-xs font-semibold text-neutral-700">
                {field.label}
              </Label>
              <Input
                id={`address-${field.name}`}
                inputMode={field.inputMode}
                disabled={isPending}
                className="h-10 rounded-xl bg-white border-neutral-200"
                {...form.register(field.name)}
              />
              {form.formState.errors[field.name] && (
                <p className="text-[11px] font-semibold text-red-600">
                  {form.formState.errors[field.name]?.message}
                </p>
              )}
            </div>
          ))}

          {errorMessage && (
            <div className="p-2 bg-red-50 text-red-800 text-xs font-semibold rounded-lg text-center">
              {errorMessage}
            </div>
          )}

          <DialogFooter className="gap-2 pt-3 border-t border-neutral-100 mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                "Save address"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
