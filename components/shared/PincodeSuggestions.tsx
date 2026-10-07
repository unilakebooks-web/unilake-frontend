/**
 * Small helpers rendered under the address form's fields by usePincodeAutofill.
 * Neutral grey on purpose — they sit inside both the dashboard form (purple)
 * and the checkout form (indigo), and must not compete with either.
 */

interface PincodeSuggestionsProps {
  /** Alternatives to the value currently in the field. Renders nothing when empty. */
  options: string[];
  onSelect: (value: string) => void;
}

/** "Also: South East · South" — one tap replaces the field's value. */
export function PincodeSuggestions({ options, onSelect }: PincodeSuggestionsProps) {
  if (options.length === 0) return null;

  return (
    <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-1 gap-y-0.5">
      <span>Also:</span>
      {options.map((option, i) => (
        <span key={option} className="inline-flex items-center gap-1">
          {i > 0 && <span aria-hidden="true">·</span>}
          <button
            type="button"
            onClick={() => onSelect(option)}
            className="font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
          >
            {option}
          </button>
        </span>
      ))}
    </p>
  );
}

/** Shown under the pincode when a valid 6-digit pincode isn't in our data. Never blocks saving. */
export function PincodeNotFoundHint({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <p className="text-xs text-gray-500">
      We couldn&apos;t find this pincode — please enter city and state.
    </p>
  );
}
