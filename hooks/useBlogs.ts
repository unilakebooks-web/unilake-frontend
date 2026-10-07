import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBlogs,
  fetchBlogById,
  createBlog,
  updateBlog,
  toggleBlogStatus,
  deleteBlog,
} from "@/app/actions/blog";

export function useBlogs(isActive?: boolean) {
  return useQuery({
    queryKey: ["admin-blogs", isActive],
    queryFn: () => fetchBlogs(isActive),
  });
}

export function useBlog(id: string) {
  return useQuery({
    queryKey: ["admin-blog", id],
    queryFn: () => fetchBlogById(id),
    enabled: !!id,
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    },
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<{
        title: string;
        body: string;
        excerpt: string;
        coverImageKey: string | null;
        tags: string[];
      }>;
    }) => updateBlog(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog", variables.id] });
    },
  });
}

export function useToggleBlogStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: toggleBlogStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
      // We don't necessarily need to invalidate the specific blog query here unless we're on its edit page,
      // but it doesn't hurt.
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
    },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    },
  });
}
