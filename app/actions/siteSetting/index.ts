import api from "@/app/lib/axios";
import type {
  SiteSetting,
  UpdateSiteSettingPayload,
} from "@/app/types/siteSetting";

/** Null until the admin saves settings for the first time. */
export async function fetchSiteSetting(): Promise<SiteSetting | null> {
  const { data } = await api.get<SiteSetting | null>("/api/admin/site-settings");
  return data;
}

/**
 * Partial update of the singleton. Keys omitted from the payload are left
 * untouched server-side; an explicit null clears that column.
 *
 * Empty strings are rejected by the API — callers must convert "" to null.
 * See toNullable() in siteSettingFormSchema.ts.
 */
export async function saveSiteSetting(
  payload: UpdateSiteSettingPayload
): Promise<SiteSetting> {
  const { data } = await api.patch<SiteSetting>(
    "/api/admin/site-settings",
    payload
  );
  return data;
}
