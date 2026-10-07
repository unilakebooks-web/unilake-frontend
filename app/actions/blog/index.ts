import api from "@/app/lib/axios";
import type { Blog, BlogListItem, BlogUploadUrlResponse } from "@/app/types/blog";

export async function fetchBlogs(isActive?: boolean): Promise<BlogListItem[]> {
  const url = isActive !== undefined ? `/api/admin/blogs?isActive=${isActive}` : "/api/admin/blogs";
  const { data } = await api.get<BlogListItem[]>(url);
  return data;
}

export async function fetchBlogById(id: string): Promise<Blog> {
  const { data } = await api.get<Blog>(`/api/admin/blogs/${id}`);
  return data;
}

export async function requestBlogUploadUrl(
  fileName: string,
  contentType: string
): Promise<BlogUploadUrlResponse> {
  const { data } = await api.post<BlogUploadUrlResponse>("/api/admin/blogs/upload-url", {
    fileName,
    contentType,
  });
  return data;
}

export async function createBlog(payload: {
  title: string;
  body: string;
  excerpt?: string;
  coverImageKey?: string;
  tags?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
}): Promise<Blog> {
  const { data } = await api.post<Blog>("/api/admin/blogs", payload);
  return data;
}

export async function updateBlog(
  id: string,
  payload: Partial<{
    title: string;
    body: string;
    // Nullable: null is how the API clears the column. It was typed as a plain
    // string, which quietly endorsed sending "" — and "" fails validation.
    excerpt: string | null;
    coverImageKey: string | null;
    tags: string[];
    metaTitle: string | null;
    metaDescription: string | null;
  }>
): Promise<Blog> {
  const { data } = await api.patch<Blog>(`/api/admin/blogs/${id}`, payload);
  return data;
}

export async function toggleBlogStatus(id: string): Promise<Blog> {
  const { data } = await api.patch<Blog>(`/api/admin/blogs/${id}/status`);
  return data;
}

export async function deleteBlog(id: string): Promise<void> {
  await api.delete(`/api/admin/blogs/${id}`);
}
