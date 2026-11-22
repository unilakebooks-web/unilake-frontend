export type BlogListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Set only when title, excerpt, body or cover change; null on posts never edited since. */
  contentUpdatedAt: string | null;
  /** The first time the post went live; null on a draft. */
  publishedAt: string | null;
  /** Description of the cover picture for the list cards; empty or missing falls back to the title. */
  coverImageAlt?: string | null;
};

export type Blog = BlogListItem & {
  body: string;
  /**
   * SEO overrides. Null falls back to `title` / `excerpt`.
   *
   * Deliberately on Blog and not BlogListItem: the list endpoint's explicit
   * select omits these, exactly as it omits `body`.
   */
  metaTitle: string | null;
  metaDescription: string | null;
  /** Share preview. Null falls back to the SEO fields, then the cover. */
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  coverImageAlt: string | null;
  /** Public detail only: the published books chosen for the end of the post, in the admin's order. */
  featuredComics?: BlogFeaturedComic[];
  /** Admin detail only: the chosen comic ids in order. */
  featuredComicIds?: string[];
};

export type BlogFeaturedComic = {
  id: string;
  slug: string | null;
  title: string;
  coverThumbnailUrls: string[];
  coverThumbnailAlts: string[];
};

export type BlogUploadUrlResponse = {
  uploadUrl: string;
  key: string;
  /**
   * The resolved, absolute R2 URL for `key`.
   *
   * Covers send `key` back to the backend and let it resolve the URL at save
   * time. In-body images cannot do that - their src is written directly into
   * the stored HTML - so the backend resolves it here instead.
   */
  publicUrl: string;
};

/** Admin save fields added for SEO, sent on create and update. A null clears; `ogImageKey` is an R2 key. */
export type BlogSharePayload = {
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageKey?: string | null;
  coverImageAlt?: string | null;
  /** At most 6 published comics, in the order shown; the whole list replaces the saved one. */
  featuredComicIds?: string[];
};
