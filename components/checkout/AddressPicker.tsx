"use client";

import { useEffect, useState } from "react";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "@/hooks/useAddresses";
import { SessionSnapshot } from "@/app/types/session";
import { updateSession } from "@/app/actions/session";
import { toast } from "sonner";
import { Loader2, Plus, Check, Pencil, Trash2, Lock, MapPin } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountryStore } from "@/stores/useCountryStore";
import { useCountryHydration } from "@/hooks/useCountryHydration";
import { SavedAddress } from "@/app/types/address";
import {
  addressFormSchema,
  addressToForm,
  emptyAddressForm,
  toCreateAddressInput,
  type AddressFormValues,
} from "@/lib/addressSchema";
import { AddressDeleteDialog } from "@/components/dashboard/address/AddressDeleteDialog";
import { usePincodeAutofill } from "@/hooks/usePincodeAutofill";
import { PincodeNotFoundHint, PincodeSuggestions } from "@/components/shared/PincodeSuggestions";

interface AddressPickerProps {
  sessionId: string;
  snapshot: SessionSnapshot;
  /** Re-reads the session. Awaited so the "Shipping to" card shows the new address, not the old one. */
  onAddressApplied: () => Promise<void> | void;
}

/**
 * Which form, if any, replaces the saved-address list:
 *   null   — the list is showing
 *   "add"  — a blank form for a new address
 *   "edit" — the form pre-filled with `editingAddress`
 */
type FormMode = null | "add" | "edit";

export default function AddressPicker({ sessionId, snapshot, onAddressApplied }: AddressPickerProps) {
  const { data: addresses, isLoading: isAddressesLoading } = useAddresses();
  const { mutateAsync: createAddressAsync } = useCreateAddress();
  const { mutateAsync: updateAddressAsync } = useUpdateAddress();
  const { mutateAsync: deleteAddressAsync } = useDeleteAddress();

  // Which card's "Use this address" is in flight, so only that card shows the
  // spinner. Every card's button is disabled while any apply runs (isApplying).
  const [applyingAddressId, setApplyingAddressId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<SavedAddress | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  // True while the customer is replacing the address shown in the "Shipping to"
  // card. Only meaningful when the session already has an address.
  const [isChanging, setIsChanging] = useState(false);

  // Country store for the form
  // Destructured: the hook returns an object, so `!useCountryHydration()` was
  // always false and the Country select never disabled while loading.
  const { isLoading: isCountriesLoading } = useCountryHydration();
  const { countries, selectedCountry } = useCountryStore();

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: emptyAddressForm(selectedCountry?.code),
  });

  const autofill = usePincodeAutofill(form);
  const country = useWatch({ control: form.control, name: "country" });

  // useForm reads defaultValues once, on the first render — usually before the
  // country list has loaded, which left the Country dropdown blank. Fill it in
  // once a country is known, but only while it is still empty, so a country the
  // customer picked (or one loaded for editing) is never overwritten.
  const selectedCountryCode = selectedCountry?.code;
  useEffect(() => {
    if (selectedCountryCode && !form.getValues("country")) {
      form.setValue("country", selectedCountryCode);
    }
  }, [selectedCountryCode, form]);

  // Derived from the address list rather than synced into state by an effect,
  // so it is right on the very first render and after any refetch: with no
  // saved addresses at all (first visit, or the last was deleted) the add form
  // shows on its own; there is no list to go back to.
  const activeFormMode: FormMode =
    formMode ?? (addresses && addresses.length === 0 ? "add" : null);

  const applyAddressToSession = async (addr: SavedAddress | AddressFormValues) => {
    setIsApplying(true);
    try {
      await updateSession(sessionId, {
        shippingName: addr.name,
        shippingLine1: addr.line1,
        shippingLine2: addr.line2 || undefined,
        shippingCity: addr.city,
        shippingState: addr.state,
        shippingZip: addr.zip,
        shippingCountry: addr.country,
        shippingPhone: addr.phone,
      });
      await onAddressApplied();
      // Back to the "Shipping to" card, now showing the address just applied.
      setIsChanging(false);
      setFormMode(null);
      setEditingAddress(null);
    } catch (error) {
      console.error("Failed to apply address:", error);
      toast.error("Failed to apply shipping address. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  // Each saved address carries its own "Use this address" button — there is no
  // separate select-then-confirm step.
  const handleUseAddress = async (addr: SavedAddress) => {
    setApplyingAddressId(addr.id);
    try {
      await applyAddressToSession(addr);
    } finally {
      setApplyingAddressId(null);
    }
  };

  // Blank form every time — a previous, abandoned entry must not linger.
  const openAddForm = () => {
    form.reset(emptyAddressForm(selectedCountry?.code));
    autofill.resetAutofill();
    setEditingAddress(null);
    setFormMode("add");
  };

  const openEditForm = (addr: SavedAddress) => {
    form.reset(addressToForm(addr));
    autofill.resetAutofill();
    setEditingAddress(addr);
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingAddress(null);
  };

  const onSubmitAddress = async (values: AddressFormValues) => {
    setIsApplying(true);
    try {
      // 1. Save to their address book — a new entry, or the one being edited.
      //    An empty label is left out on create and cleared (null) on edit;
      //    the backend rejects null on create.
      const saved =
        formMode === "edit" && editingAddress
          ? await updateAddressAsync({
              id: editingAddress.id,
              input: { ...values, label: values.label || null },
            })
          : await createAddressAsync(toCreateAddressInput(values));

      // 2. Apply to session
      await applyAddressToSession(saved);
      closeForm();
    } catch (error) {
      console.error("Failed to save address:", error);
      toast.error("Failed to save address.");
      setIsApplying(false);
    }
  };

  // The session keeps its own copy of the shipping fields, so deleting an
  // address that is already applied does not un-apply it.
  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddressAsync(id);
      if (editingAddress?.id === id) closeForm();
      // Deleting the last one reveals the add form (see activeFormMode) — make
      // sure it opens blank rather than holding an earlier entry.
      if (addresses?.length === 1) {
        form.reset(emptyAddressForm(selectedCountry?.code));
        autofill.resetAutofill();
      }
      toast.success("Address deleted.");
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast.error("Failed to delete address. Please try again.");
    }
  };

  if (isAddressesLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm flex justify-center py-12">
        <Loader2 className="animate-spin text-[#3F3C95]" size={32} />
      </div>
    );
  }

  // Check if session already has full shipping data
  const hasFullShipping =
    snapshot.shippingName &&
    snapshot.shippingLine1 &&
    snapshot.shippingCity &&
    snapshot.shippingState &&
    snapshot.shippingZip &&
    snapshot.shippingCountry &&
    snapshot.shippingPhone;

  const hasAddresses = !!addresses && addresses.length > 0;

  // Once Pay Now has been pressed the session is AWAITING_PAYMENT and the
  // backend freezes every shipping field (any PATCH to them 409s), so the
  // address can be looked at but no longer changed.
  const isLocked = snapshot.status === "AWAITING_PAYMENT";

  // The session holds its OWN copy of the address, independent of the address
  // book — deleting a saved address does not remove it. This card shows that
  // copy, because it is what the order ships to and what Pay Now checks.
  const showAppliedCard = !!hasFullShipping && (isLocked || !isChanging);

  const appliedCountryName =
    countries.find((c) => c.code === snapshot.shippingCountry)?.name ??
    snapshot.shippingCountry;

  const startChanging = () => {
    setFormMode(null);
    setEditingAddress(null);
    setIsChanging(true);
  };

  const stopChanging = () => {
    setFormMode(null);
    setEditingAddress(null);
    setIsChanging(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#3F3C95]">Shipping Address</h2>
        {hasFullShipping && !isApplying && (
          <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <Check size={16} /> Applied
          </div>
        )}
      </div>

      {showAppliedCard && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border-2 border-[#3F3C95] bg-[#3F3C95]/5">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-[#3F3C95]">
              <MapPin size={14} /> Shipping to
            </div>
            <p className="font-bold text-gray-800 wrap-break-word">{snapshot.shippingName}</p>
            <div className="text-sm text-gray-600 space-y-0.5 mt-1 wrap-break-word">
              <p>{snapshot.shippingLine1}</p>
              {snapshot.shippingLine2 && <p>{snapshot.shippingLine2}</p>}
              <p>
                {snapshot.shippingCity}, {snapshot.shippingState} {snapshot.shippingZip}
              </p>
              <p>{appliedCountryName}</p>
              <p className="pt-1 text-gray-500">📞 {snapshot.shippingPhone}</p>
            </div>
          </div>

          {isLocked ? (
            <div className="flex items-start gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
              <Lock size={16} className="shrink-0 mt-0.5" />
              <span>
                This address is locked for this order because payment has already
                been started. Please contact support if it needs to change.
              </span>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={startChanging}
              className="w-full rounded-full font-bold h-12 border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <Pencil size={16} className="mr-2" /> Change address
            </Button>
          )}
        </div>
      )}

      {/* Toolbar above the list (or the form):
            left  — "Keep current address": back out of a change without
                    touching the applied address. Only when one is applied.
            right — "+ Add new address". Only while the list is showing; the
                    form has its own Cancel to get back. */}
      {!showAppliedCard &&
        (hasFullShipping || (activeFormMode === null && hasAddresses)) && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {hasFullShipping ? (
              <button
                type="button"
                onClick={stopChanging}
                disabled={isApplying}
                className="text-sm font-semibold text-[#3F3C95] hover:underline disabled:opacity-50"
              >
                Keep current address
              </button>
            ) : (
              <span />
            )}

            {activeFormMode === null && hasAddresses && (
              <Button
                type="button"
                variant="outline"
                onClick={openAddForm}
                disabled={isApplying}
                className="ml-auto h-9 px-4 rounded-full border-2 border-[#3F3C95] text-[#3F3C95] text-sm font-bold hover:bg-[#3F3C95]/5"
              >
                <Plus size={16} className="mr-1" /> Add new address
              </Button>
            )}
          </div>
        )}

      {!showAppliedCard && activeFormMode === null && hasAddresses && (
        <div className="space-y-4">
          {/* grid-cols-1 = minmax(0, 1fr). A bare `grid` gives an `auto`
              column, which cannot shrink below its widest unbreakable content —
              the card's one-line header row — so on a phone the card spilled
              out of this panel and pushed the whole page sideways. */}
          <div className="grid grid-cols-1 gap-3">
            {addresses.map((addr) => {
              // Edit/Delete are rendered in two places: beside the name from
              // sm up, and on the card's bottom row on phones, where the
              // header row has no room for them. Only one copy is ever
              // displayed; `hidden` also removes the other from the
              // accessibility tree.
              const actions = (
                <>
                  <button
                    type="button"
                    onClick={() => openEditForm(addr)}
                    disabled={isApplying}
                    className="flex items-center gap-1 text-xs font-semibold text-[#3F3C95] hover:bg-[#3F3C95]/10 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                    aria-label={`Edit address for ${addr.name}`}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressToDelete(addr)}
                    disabled={isApplying}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                    aria-label={`Delete address for ${addr.name}`}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              );

              const isThisApplying = applyingAddressId === addr.id;

              // Not clickable: each card is chosen with its own button, so
              // there is no selected/highlighted state any more.
              return (
                <div
                  key={addr.id}
                  className="min-w-0 p-4 rounded-xl border-2 border-gray-200"
                >
                  <div className="flex justify-between items-start gap-3 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-gray-800 truncate">{addr.name}</span>
                      {addr.label && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md shrink-0">
                          {addr.label}
                        </span>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-1 shrink-0">{actions}</div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-0.5 wrap-break-word">
                    <p>{addr.line1}</p>
                    {addr.line2 && <p>{addr.line2}</p>}
                    <p>{addr.city}, {addr.state} {addr.zip}</p>
                    <p>{addr.country}</p>
                    <p className="pt-1 text-gray-500">📞 {addr.phone}</p>
                  </div>

                  {/* Bottom row: Edit/Delete on the left (phones only — from
                      sm up they sit beside the name) and this card's own
                      "Use this address" pill on the right. flex-wrap so that
                      on the narrowest phones the pill drops to its own line,
                      still right-aligned via ml-auto, instead of overflowing.
                      -ml-2 lines Edit's text up with the address above,
                      cancelling its own px-2 hover padding. */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <div className="flex sm:hidden items-center gap-2 -ml-2">{actions}</div>
                    <Button
                      type="button"
                      onClick={() => handleUseAddress(addr)}
                      disabled={isApplying}
                      className="ml-auto h-9 px-4 rounded-full bg-[#3F3C95] hover:bg-[#3F3C95]/90 text-white text-sm font-bold"
                    >
                      {isThisApplying ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        "Use this address"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!showAppliedCard && activeFormMode !== null && (
        <div className={hasAddresses ? "pt-4 border-t border-gray-100 mt-4" : ""}>
          {/* With no saved addresses there is nothing to go back to, so the
              header (and its Cancel) only shows when a list exists. */}
          {hasAddresses && (
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">
                {activeFormMode === "edit" ? "Edit Address" : "Add New Address"}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="text-sm font-semibold text-[#3F3C95] hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* No placeholders on any field — sample values like "John Doe" or
              "New York" read as pre-filled data. */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAddress)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="line2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pincode sits above City/State so that, for an Indian address,
                  typing it fills the two fields the customer reaches next. */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP / Postal Code</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="postal-code"
                          inputMode={country === "IN" ? "numeric" : undefined}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            autofill.handlePincodeChange(e.target.value);
                          }}
                          onFocus={autofill.handlePincodeFocus}
                        />
                      </FormControl>
                      <FormMessage />
                      <PincodeNotFoundHint show={autofill.status === "not-found"} />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Country</FormLabel>
                      {/* Controlled (`value`, not `defaultValue`), so a form
                          reset for add/edit updates the shown country too. */}
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          autofill.handleCountryChange(value ?? "");
                        }}
                        value={field.value}
                        disabled={isCountriesLoading}
                      >
                        <FormControl>
                          {/* w-full overrides SelectTrigger's base w-fit, which
                              would otherwise size to the longest country name
                              and overflow this grid column. */}
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                      <PincodeSuggestions
                        options={autofill.suggestions.city}
                        onSelect={(value) => autofill.applySuggestion("city", value)}
                      />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                      <PincodeSuggestions
                        options={autofill.suggestions.state}
                        onSelect={(value) => autofill.applySuggestion("state", value)}
                      />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isApplying}
                className="w-full bg-[#3F3C95] hover:bg-[#3F3C95]/90 text-white rounded-full font-bold h-12 mt-2"
              >
                {isApplying ? <Loader2 className="animate-spin" size={20} /> : "Save & Use Address"}
              </Button>
            </form>
          </Form>
        </div>
      )}

      {/* Same confirmation as the dashboard's My Addresses page. */}
      <AddressDeleteDialog
        open={addressToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setAddressToDelete(null);
        }}
        address={addressToDelete}
        onConfirm={handleDeleteAddress}
      />
    </div>
  );
}
