/**
 * Brand and contact details — a singleton row edited from admin Settings and
 * consumed by both the /contact page and the site-wide Footer.
 *
 * Every field is nullable: the admin fills this in progressively, and the whole
 * row is null until the first save. Consumers render what is set and hide the
 * rest.
 */
export type SiteSetting = {
  id: string;

  /**
   * Store status. NOT nullable — the column is NOT NULL with a `true` default,
   * so it is the one field on this model that always has a value.
   *
   * `false` means customers can still browse and generate previews but cannot
   * pay: the backend rejects any NEW checkout. Enforcement lives there, not
   * here — the banners and the toast are how a customer finds out, not what
   * stops them.
   *
   * Read it as `setting?.acceptingOrders ?? true`: the whole row is null until
   * the first save, and the public fetch returns null on a network error, so
   * absence must mean "open" to match the column default.
   */
  acceptingOrders: boolean;

  // Brand — rendered in the Footer
  brandDescription: string | null;

  // Intro copy at the top of /contact
  headline: string | null;
  description: string | null;

  // Contact channels
  email: string | null;
  phone: string | null;
  whatsappPhone: string | null;
  businessHours: string | null;

  // Address
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  mapEmbedUrl: string | null;

  // SEO — site-wide fallback title/description used by the root layout for any
  // page that does not supply its own
  metaTitle: string | null;
  metaDescription: string | null;

  // Socials — also consumed by the Footer
  instagramUrl: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;

  createdAt: string;
  updatedAt: string;
};

type EditableSiteSettingKey = Exclude<
  keyof SiteSetting,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * What the admin sends on a partial update. Every key is optional — omitted
 * means "leave this column alone", and an explicit null clears it. The backend
 * rejects empty strings, so callers must convert "" to null before submitting.
 *
 * Mapped rather than a flat `Record<…, string | null>` so each field keeps its
 * own type: the text columns stay `string | null` while `acceptingOrders` stays
 * a plain boolean. Widening the record to `string | boolean | null` would also
 * compile, at the cost of letting `brandDescription: true` through the type
 * checker and failing only at the API.
 */
export type UpdateSiteSettingPayload = {
  [K in EditableSiteSettingKey]?: SiteSetting[K] extends string | null
    ? string | null
    : SiteSetting[K];
};
