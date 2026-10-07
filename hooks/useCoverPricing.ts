"use client";

import { usePublicComic } from "@/hooks/usePublicComics";
import { useCountryStore } from "@/stores/useCountryStore";

/**
 * The softcover and hardcover pricing rules for one comic in the visitor's
 * selected country, plus the currency symbol to print them with.
 *
 * Shared by the full checkout section and the compact floating checkout bar on
 * the preview page, so the two can never disagree about a price. The comic
 * query is cached by TanStack, so calling this from both costs one request.
 *
 * A rule is undefined when the comic isn't priced for that cover in the
 * selected country — callers show "N/A" and disable that option.
 */
export function useCoverPricing(comicId: string) {
  const { data: comicDetail } = usePublicComic(comicId);
  const { selectedCountry, getCurrencySymbol } = useCountryStore();

  const countryPricing =
    comicDetail?.pricingRules.filter(
      (rule) => rule.country.code === selectedCountry?.code
    ) ?? [];

  return {
    /** False until the comic has loaded; render nothing before then. */
    isLoaded: comicDetail !== undefined,
    softcoverRule: countryPricing.find((r) => r.coverType === "SOFTCOVER"),
    hardcoverRule: countryPricing.find((r) => r.coverType === "HARDCOVER"),
    currencySymbol: getCurrencySymbol(),
  };
}
