import { useEffect } from "react";
import { usePublicCountries } from "./usePublicComics";
import { useCountryStore } from "@/stores/useCountryStore";

export function useCountryHydration() {
  const { data: countries, isLoading, isError } = usePublicCountries();
  const setCountries = useCountryStore((state) => state.setCountries);

  useEffect(() => {
    if (countries) {
      setCountries(countries);
    }
  }, [countries, setCountries]);

  return { isLoading, isError };
}
