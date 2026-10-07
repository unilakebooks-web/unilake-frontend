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
};

export type BlogUploadUrlResponse = {
  uploadUrl: string;
  key: string;
  /**
   * The resolved, absolute R2 URL for `key`.
   *
   * Covers send `key` back to the backend and let it resolve the URL at save
   * time. In-body images cannot do that — their src is written directly into
   * the stored HTML — so the backend resolves it here instead.
   */
  publicUrl: string;
};
