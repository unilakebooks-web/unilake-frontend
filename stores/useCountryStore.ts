import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PublicCountry } from "@/app/types/country";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
};

interface CountryStoreState {
  countries: PublicCountry[];
  selectedCountry: PublicCountry | null;
  setCountries: (countries: PublicCountry[]) => void;
  selectCountry: (code: string) => void;
  getCurrencySymbol: () => string;
}

export const useCountryStore = create<CountryStoreState>()(
  persist(
    (set, get) => ({
      countries: [],
      selectedCountry: null,

      setCountries: (countries) => {
        set({ countries });
        const { selectedCountry } = get();
        // If there are countries available
        if (countries.length > 0) {
          // Check if previously selected country exists in new list
          const existingSelection = selectedCountry 
            ? countries.find(c => c.code === selectedCountry.code)
            : null;
            
          if (!existingSelection) {
            // Default to India if available, else first country
            const india = countries.find(c => c.code === "IN");
            set({ selectedCountry: india || countries[0] });
          } else {
             // Update the selected country with fresh data (e.g. if flagUrl changed)
             set({ selectedCountry: existingSelection });
          }
        } else {
           set({ selectedCountry: null });
        }
      },

      selectCountry: (code) => {
        const { countries } = get();
        const found = countries.find((c) => c.code === code);
        if (found) {
          set({ selectedCountry: found });
        }
      },

      getCurrencySymbol: () => {
        const { selectedCountry } = get();
        if (!selectedCountry) return "";
        return CURRENCY_SYMBOLS[selectedCountry.currencyCode] || selectedCountry.currencyCode;
      },
    }),
    {
      name: "country-store", // name of the item in the storage (must be unique)
      partialize: (state) => ({ selectedCountry: state.selectedCountry }), // Only persist selectedCountry
    }
  )
);
