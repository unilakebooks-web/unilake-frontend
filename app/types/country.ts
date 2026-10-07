export interface Country {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  flagUrl: string;
  isActive: boolean;

  /**
   * Only present on GET /api/admin/countries. Create and update return a plain
   * country row without it, hence optional. Drives the delete dialog's warning:
   * deleting a country cascades every one of these rules away.
   */
  _count?: {
    pricingRules: number;
  };
}

export interface DeleteCountryResult {
  /** How many pricing rules the cascade destroyed alongside the country. */
  deletedPricingRules: number;
}

export interface PublicCountry {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  flagUrl: string;
}

export interface CountryUploadUrlResponse {
  uploadUrl: string;
  key: string;
}
