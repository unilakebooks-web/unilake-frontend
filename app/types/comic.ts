export enum GenderTag {
  BOY = "BOY",
  GIRL = "GIRL",
  UNISEX = "UNISEX",
}

export enum AgeGroup {
  AGE_0_2 = "AGE_0_2",
  AGE_3_5 = "AGE_3_5",
  AGE_6_8 = "AGE_6_8",
  AGE_9_12 = "AGE_9_12",
}

export enum CoverType {
  HARDCOVER = "HARDCOVER",
  SOFTCOVER = "SOFTCOVER",
}

export enum ComicStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  UNPUBLISHED = "UNPUBLISHED",
  PUBLISHING = "PUBLISHING",
}

export enum FaceDirection {
  FRONT = "front",
  THREE_QUARTER = "three-quarter",
  SIDE = "side",
}

export enum FontExtension {
  TTF = "ttf",
  OTF = "otf",
  WOFF = "woff",
  WOFF2 = "woff2",
}

export enum PageFileType {
  ARTWORK = "artwork",
  MASKS = "masks",
}

export enum PageFileExtension {
  JPG = "jpg",
  JPEG = "jpeg",
  PNG = "png",
  WEBP = "webp",
}

/** A theme as embedded in comic responses (alphabetical by name). */
export interface ComicTheme {
  id: string;
  name: string;
}

export interface Comic {
  id: string;
  title: string;
  /** One or more, in the fixed order BOY, GIRL, UNISEX. */
  genderTags: GenderTag[];
  pageCount: number;
  freePreviewPages: number;
  coverThumbnailUrls: string[];
  /**
   * Optional promo video for the comic-detail carousel. Full R2 public URL, or
   * null when the comic has none (most of them). Written via the unified comic
   * PATCH as `videoKey` — the request field and the response field differ on
   * purpose: you send a key, you get back a URL.
   */
  previewVideoUrl: string | null;
  /**
   * SEO overrides for search results and link previews. Null on most comics,
   * in which case the page falls back to `title` / `description`.
   */
  metaTitle: string | null;
  metaDescription: string | null;
  loraFileUrl: string | null;
  loraStrength: number;
  status: ComicStatus;
  publishJobId: string | null;
  publishError: string | null;
  isBestseller: boolean;
  description: string | null;
  /**
   * Youngest first. Required on save, but may be empty on comics created
   * before multi-select existed and never re-saved.
   */
  ageGroups: AgeGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface ComicListItem extends Comic {
  /** May be empty on older comics — see `ageGroups`. */
  themes: ComicTheme[];
  _count: { pages: number; orderSessions: number; pricingRules: number };
}

export interface ComicDetail extends Comic {
  /** May be empty on older comics — see `ageGroups`. */
  themes: ComicTheme[];
  pages: PageWithBubbles[];
  fonts: Font[];
  pricingRules: PricingRuleWithCountry[];
  _count: { orderSessions: number };
}

export interface Font {
  id: string;
  comicId: string;
  name: string;
  fileUrl: string;       // private key, NOT a usable URL
  createdAt: string;
}

export interface FontWithCount extends Font {
  _count: { bubbles: number };
}

export interface Page {
  id: string;
  comicId: string;
  pageNumber: number;
  artworkUrl: string | null;
  maskUrl: string | null;
  artworkWidth: number | null;
  artworkHeight: number | null;
  hasFace: boolean;
  mirrorFace: boolean;
  faceDirection: string | null;
  isPreviewPage: boolean;
  pagePrompt: string | null;
  steps: number;
  cfg: number;
  createdAt: string;
  updatedAt: string;
  warnings: string[];
}

export interface PageWithBubbles extends Page {
  bubbles: Bubble[];
}

export interface PageWithBubblesAndFont extends Page {
  bubbles: BubbleWithFont[];
}


export type TextAlign = "LEFT" | "CENTER" | "RIGHT";
export type TextVerticalAlign = "TOP" | "MIDDLE" | "BOTTOM";
export type TextCase = "AS_TYPED" | "UPPERCASE" | "LOWERCASE";

// NOTE: There is intentionally no `rotation` field. The backend `Bubble` model
// stores 13 fields only (x, y, width, height, dialogue, fontId, fontSize,
// fontColor, nameColor, textAlign, textVerticalAlign, textCase, sortOrder) and
// validateBody strips anything else silently — a rotation sent here would save
// with a 200 and vanish on reload.
// Removed 2026-08-01. To add it later: rotation column + migration, both Zod
// schemas, rotation support in the Sharp text stamper, and a decision on whether
// the x+width<=1 bound applies to the rotated bounding box or the unrotated one.
// Cheapest to do BEFORE the SD worker is written.

export interface Bubble {
  id: string;
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dialogue: string;
  fontId: string | null;
  fontSize: number;
  /** Canonical "#rrggbb". Never null — the column defaults to #000000. */
  fontColor: string;
  /**
   * Canonical "#rrggbb" for the {name} part of the dialogue only.
   * null = the name is drawn in fontColor like the rest of the text.
   */
  nameColor: string | null;
  /** Horizontal placement of each line inside the bubble box. */
  textAlign: TextAlign;
  /** Placement of the whole block of lines inside the bubble box. */
  textVerticalAlign: TextVerticalAlign;
  /** Casing applied to the dialogue at render time, child's name included. */
  textCase: TextCase;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BubbleWithFont extends Bubble {
  font: { id: string; name: string } | null;
}

/** Pronoun set used to resolve {pronoun_*} tokens in a preview render. */
export type PreviewPronounKey = "HE" | "SHE" | "THEY";

/**
 * One bubble as sent to the preview endpoint. Not a stored Bubble: `id` may be
 * a client-side draft id, and pageId/timestamps are irrelevant to a render.
 */
export interface PreviewStampBubble {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dialogue: string;
  fontId?: string | null;
  fontSize: number;
  fontColor: string;
  nameColor: string | null;
  textAlign: TextAlign;
  textVerticalAlign: TextVerticalAlign;
  textCase: TextCase;
}

export interface PreviewStampRequest {
  childName: string;
  pronounKey: PreviewPronounKey;
  bubbles: PreviewStampBubble[];
}

export interface PreviewStampResponse {
  /** A `data:image/webp;base64,...` URI, renderable straight into an <img>. */
  image: string;
  artworkWidth: number;
  artworkHeight: number;
}

export interface PricingRule {
  id: string;
  comicId: string;
  countryId: string;
  coverType: CoverType;
  // Strike-through price. Null on rows created before this field existed —
  // the column is nullable purely to tolerate those. Every new write supplies it.
  mrp: string | null;    // comes as STRING from API
  price: string;         // comes as STRING from API
  createdAt: string;
  updatedAt: string;
}

export interface PricingRuleWithCountry extends PricingRule {
  country: {
    id: string;
    name: string;
    code: string;
    currencyCode: string;
    flagUrl: string;
  };
}

// Upload response types
export interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
}

export interface ThumbnailUploadResponse {
  uploads: UploadUrlResponse[];
}

// Create comic payload
export interface CreateComicPayload {
  title: string;
  genderTags: GenderTag[];
  pageCount: number;
  freePreviewPages: number;
  thumbnailKeys: string[];
  pricing: {
    countryId: string;
    coverType: CoverType;
    mrp: number;
    price: number;
  }[];
  description?: string;
  themeIds: string[];
  ageGroups: AgeGroup[];
  isBestseller?: boolean;
}

export interface PublicPricingRule {
  mrp: string | null;
  price: string;
  coverType: CoverType;
  country: {
    code: string;
    name: string;
    flagUrl: string;
    currencyCode: string;
  };
}

export interface PublicComicListItem {
  id: string;
  title: string;
  description: string | null;
  genderTags: GenderTag[];
  ageGroups: AgeGroup[];
  isBestseller: boolean;
  pageCount: number;
  coverThumbnailUrls: string[];
  themes: ComicTheme[];
  pricingRules: PublicPricingRule[];
}

/** Which generation screen a fact rotates on. */
export type ComicFactPlacement = "PRELOADER" | "GENERATING";

/**
 * A fact as the public site sees it. The API only ever sends active ones, and
 * only these three fields — there is no isActive here because an inactive fact
 * never reaches the browser at all.
 */
export interface ComicFact {
  id: string;
  placement: ComicFactPlacement;
  text: string;
}

/** The admin view, which also sees switched-off facts. */
export interface AdminComicFact {
  id: string;
  comicId: string;
  placement: ComicFactPlacement;
  text: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicComicDetailPage {
  id: string;
  pageNumber: number;
  artworkUrl: string;
  artworkWidth: number;
  artworkHeight: number;
}

export interface PublicComicDetail {
  id: string;
  title: string;
  description: string | null;
  genderTags: GenderTag[];
  ageGroups: AgeGroup[];
  isBestseller: boolean;
  pageCount: number;
  freePreviewPages: number;
  coverThumbnailUrls: string[];
  /**
   * Null for most comics. Returned by the detail endpoint only — the catalogue
   * list (PublicComicListItem) deliberately does not carry it.
   */
  previewVideoUrl: string | null;
  /** Null falls back to `title` / `description` — see generateMetadata. */
  metaTitle: string | null;
  metaDescription: string | null;
  /**
   * Active facts for both generation screens, in one flat list — the consumer
   * filters by placement. Empty for most comics; both screens fall back to a
   * default line when there is nothing here.
   */
  facts: ComicFact[];
  themes: ComicTheme[];
  pricingRules: PublicPricingRule[];
  pages: PublicComicDetailPage[];
}
