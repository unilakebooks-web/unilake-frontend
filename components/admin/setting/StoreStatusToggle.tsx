"use client";

import { Loader2, PauseCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useSaveSiteSetting } from "@/hooks/useSiteSettings";
import type { SiteSetting } from "@/app/types/siteSetting";
import { getErrorMessage } from "@/lib/utils";

/**
 * The store's on/off switch.
 *
 * Saves the instant it is flipped, rather than sitting inside the contact
 * details form and waiting on that form's Save button. Two reasons:
 *
 *   1. This is the control you reach for in a hurry. Scrolling past nineteen
 *      fields and submitting the whole form is friction on exactly the action
 *      that should be immediate.
 *   2. Correctness. The settings form sends every field it holds, so if this
 *      flag lived there, saving a phone number would write the form's own
 *      (possibly stale) copy of the flag back over whatever the real value was.
 *      Owning this column alone makes that impossible.
 *
 * Reads `setting?.acceptingOrders ?? true` — the row is null until the first
 * save, and absence has to mean "open" to match the column's own default.
 */
export function StoreStatusToggle({ setting }: { setting: SiteSetting | null }) {
  const { mutate, isPending } = useSaveSiteSetting();

  const acceptingOrders = setting?.acceptingOrders ?? true;

  const handleChange = (next: boolean) => {
    mutate(
      { acceptingOrders: next },
      {
        onSuccess: () => {
          toast.success(
            next
              ? "Orders are open — customers can pay again."
              : "Orders paused — customers can still preview, but not pay."
          );
        },
        onError: (error) => {
          // No local state to roll back: the switch renders straight off the
          // query cache, so a failed save simply leaves it showing the server's
          // value. The toast is the only thing that has to happen here.
          toast.error(
            getErrorMessage(error, "Couldn't update the store status.")
          );
        },
      }
    );
  };

  return (
    <section className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              acceptingOrders
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {acceptingOrders ? (
              <ShoppingBag className="w-5 h-5" />
            ) : (
              <PauseCircle className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-neutral-900">
              Accepting orders
            </h2>
            {/* States the consequence, not the field name — whoever flips this
                needs to know what customers will experience. */}
            <p className="text-sm text-neutral-500 mt-1">
              {acceptingOrders
                ? "Customers can preview comics and pay as normal."
                : "Customers can still preview comics, but cannot pay. They'll see a note explaining why."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-1">
          {isPending && (
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
          )}
          <Switch
            checked={acceptingOrders}
            onCheckedChange={handleChange}
            disabled={isPending}
            aria-label="Accepting orders"
          />
        </div>
      </div>

      {!acceptingOrders && (
        <p className="mt-5 pt-4 border-t border-neutral-100 text-xs text-amber-700 font-medium">
          Anyone who had already opened the payment window before you paused can
          still finish that payment. Orders already paid for are unaffected and
          continue to print and ship.
        </p>
      )}
    </section>
  );
}
