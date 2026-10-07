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
import { TriangleAlert, Loader2, Trash2 } from "lucide-react";
import { Country } from "@/app/types/country";

interface CountryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  country: Country | null;
  onConfirm: (id: string) => Promise<void>;
}

export function CountryDeleteDialog({
  open,
  onOpenChange,
  country,
  onConfirm,
}: CountryDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!country) return null;

  // Only GET /api/admin/countries carries _count, so treat a missing one as 0
  // and simply show no warning rather than guessing at a number.
  const pricingRuleCount = country._count?.pricingRules ?? 0;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirm(country.id);
      onOpenChange(false);
    } catch (err: any) {
      // Pricing rules no longer block the delete — they cascade. This is still
      // here for genuine failures (network drop, 404 on an already-deleted row).
      setErrorMessage(err?.message || "Failed to delete country");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isDeleting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-red-200 shadow-xl rounded-2xl p-6">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Delete Country?
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 p-3.5 flex items-center gap-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-700">
          <div className="w-8 h-6 bg-neutral-200 rounded overflow-hidden shadow-sm shrink-0">
            {country.flagUrl && (
              <img
                src={country.flagUrl}
                alt="Flag"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div>
            <p className="text-sm font-bold">{country.name}</p>
            <p className="text-xs font-mono text-neutral-500">
              {country.code} • {country.currencyCode}
            </p>
          </div>
        </div>

        {pricingRuleCount > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <p className="text-xs font-semibold leading-relaxed">
              This will also permanently delete{" "}
              <span className="font-bold">
                {pricingRuleCount} pricing rule{pricingRuleCount === 1 ? "" : "s"}
              </span>{" "}
              across every comic priced in {country.name}. Those comics will have
              no price in this country until you set one up again.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <DialogFooter className="gap-2 pt-3 border-t border-neutral-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-5 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold h-10 px-5 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
