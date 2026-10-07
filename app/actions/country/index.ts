import api from "@/app/lib/axios";
import type {
  Country,
  CountryUploadUrlResponse,
  DeleteCountryResult,
  PublicCountry,
} from "@/app/types/country";

export async function fetchCountries(): Promise<Country[]> {
  const { data } = await api.get<Country[]>("/api/admin/countries");
  return data;
}

export async function fetchPublicCountries(): Promise<PublicCountry[]> {
  const { data } = await api.get<PublicCountry[]>("/api/public/countries");
  return data;
}

export async function requestFlagUploadUrl(
  fileName: string,
  contentType: string
): Promise<CountryUploadUrlResponse> {
  const { data } = await api.post<CountryUploadUrlResponse>("/api/admin/countries/upload-url", {
    fileName,
    contentType,
  });
  return data;
}

export async function createCountry(dataToSubmit: {
  code: string;
  name: string;
  currencyCode: string;
  flagKey: string;
}): Promise<Country> {
  const { data } = await api.post<Country>("/api/admin/countries", dataToSubmit);
  return data;
}

export async function updateCountry(
  id: string,
  dataToSubmit: Partial<{
    code: string;
    name: string;
    currencyCode: string;
    flagKey: string;
  }>
): Promise<Country> {
  const { data } = await api.put<Country>(`/api/admin/countries/${id}`, dataToSubmit);
  return data;
}

export async function deleteCountry(id: string): Promise<DeleteCountryResult> {
  const { data } = await api.delete<DeleteCountryResult>(`/api/admin/countries/${id}`);
  return data;
}
