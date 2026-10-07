import { useQuery } from "@tanstack/react-query";
import {
  fetchPublicFaqs,
  fetchPublicBlogs,
  fetchPublicBlogBySlug,
  fetchPublicGoogleReviews,
} from "@/app/actions/public";
import { FaqPlacement } from "@/app/types/faq";

export function usePublicFaqs(placement: FaqPlacement) {
  return useQuery({
    queryKey: ["public-faqs", placement],
    queryFn: () => fetchPublicFaqs(placement),
  });
}

export function usePublicGoogleReviews() {
  return useQuery({
    queryKey: ["public-google-reviews"],
    queryFn: fetchPublicGoogleReviews,
  });
}

export function usePublicBlogs() {
  return useQuery({
    queryKey: ["public-blogs"],
    queryFn: fetchPublicBlogs,
  });
}

export function usePublicBlog(slug: string) {
  return useQuery({
    queryKey: ["public-blog", slug],
    queryFn: () => fetchPublicBlogBySlug(slug),
    enabled: !!slug,
  });
}
