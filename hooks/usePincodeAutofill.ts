import { useCallback, useRef, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { AddressFormValues } from "@/lib/addressSchema";
import {
  INDIAN_PINCODE,
  lookupPincode,
  preloadPincodes,
  type PincodeMatch,
} from "@/lib/pincodeLookup";

type AutofillField = "city" | "state";

/**
 * - idle      — nothing to say (not India, pincode incomplete, or no lookup yet)
 * - found     — fields were offered values from the data
 * - not-found — a full 6-digit Indian pincode that isn't in the data
 */
export type PincodeStatus = "idle" | "found" | "not-found";

/**
 * Fills City and State from the pincode on an Indian address, while leaving
 * both fields fully editable.
 *
 * Event-driven, not effect-driven: callers invoke `handlePincodeChange` /
 * `handleCountryChange` from the inputs' own change handlers. An effect watching
 * `zip` would also fire when an edit form is reset with a saved address, and
 * silently rewrite City/State the moment the form opened.
 *
 * Overwrite rule — a field is only replaced while it is still "ours":
 *   - it is empty, or
 *   - it still holds the value the form was loaded with (a saved address being
 *     edited — changing its pincode means the address moved), or
 *   - it still holds the value this hook last wrote into it.
 * Anything the user typed themselves is never clobbered.
 *
 * Call `resetAutofill()` wherever the form itself is reset, so a hint or
 * suggestions from a previous entry don't linger.
 */
export function usePincodeAutofill(form: UseFormReturn<AddressFormValues>) {
  const [status, setStatus] = useState<PincodeStatus>("idle");
  const [match, setMatch] = useState<PincodeMatch | null>(null);

  // Last value this hook wrote per field — what makes a field "still ours".
  const autoFilledRef = useRef<Partial<Record<AutofillField, string>>>({});
  // Lookups are async; only the newest one may write. Typing 6 digits, then a
  // 7th, then deleting it fires several — a slow early one must not win.
  const requestIdRef = useRef(0);

  const city = useWatch({ control: form.control, name: "city" });
  const state = useWatch({ control: form.control, name: "state" });

  const isReplaceable = useCallback(
    (field: AutofillField) => {
      const current = form.getValues(field);
      return (
        current.trim() === "" ||
        current === form.formState.defaultValues?.[field] ||
        current === autoFilledRef.current[field]
      );
    },
    [form]
  );

  const writeField = useCallback(
    (field: AutofillField, value: string) => {
      form.setValue(field, value, { shouldDirty: true, shouldValidate: true });
      autoFilledRef.current[field] = value;
    },
    [form]
  );

  const runLookup = useCallback(
    async (rawPin: string, country: string) => {
      const requestId = ++requestIdRef.current;
      const pin = rawPin.trim();

      if (country !== "IN" || !INDIAN_PINCODE.test(pin)) {
        setStatus("idle");
        setMatch(null);
        return;
      }

      let result: PincodeMatch | null;
      try {
        result = await lookupPincode(pin);
      } catch (err) {
        // Data failed to download (offline, deploy mid-flight). Not worth
        // alarming the customer — they can type City/State as before.
        console.warn("Pincode lookup unavailable:", err);
        if (requestId === requestIdRef.current) {
          setStatus("idle");
          setMatch(null);
        }
        return;
      }

      if (requestId !== requestIdRef.current) return;

      if (!result) {
        setStatus("not-found");
        setMatch(null);
        return;
      }

      setStatus("found");
      setMatch(result);
      if (isReplaceable("city")) writeField("city", result.cities[0]);
      if (isReplaceable("state")) writeField("state", result.states[0]);
    },
    [isReplaceable, writeField]
  );

  /** Call from the pincode input's onChange, after the form has the new value. */
  const handlePincodeChange = useCallback(
    (pin: string) => {
      void runLookup(pin, form.getValues("country"));
    },
    [runLookup, form]
  );

  /** Call from the country select's onValueChange, after the form has the new value. */
  const handleCountryChange = useCallback(
    (country: string) => {
      void runLookup(form.getValues("zip"), country);
    },
    [runLookup, form]
  );

  /** Call from the pincode input's onFocus — warms the data before the 6th digit. */
  const handlePincodeFocus = useCallback(() => {
    if (form.getValues("country") === "IN") preloadPincodes();
  }, [form]);

  /** A suggestion chip was tapped. Counts as auto-filled, so a later pincode can replace it. */
  const applySuggestion = useCallback(
    (field: AutofillField, value: string) => writeField(field, value),
    [writeField]
  );

  const resetAutofill = useCallback(() => {
    requestIdRef.current++; // orphan any lookup still in flight
    autoFilledRef.current = {};
    setStatus("idle");
    setMatch(null);
  }, []);

  // Alternatives = every candidate except the one currently in the field. If the
  // user typed something of their own, all candidates show, first one included.
  const suggestions = {
    city: match ? match.cities.filter((c) => c !== city) : [],
    state: match ? match.states.filter((s) => s !== state) : [],
  };

  return {
    status,
    suggestions,
    handlePincodeChange,
    handleCountryChange,
    handlePincodeFocus,
    applySuggestion,
    resetAutofill,
  };
}
