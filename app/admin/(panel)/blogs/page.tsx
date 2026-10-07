"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BlogListItem } from "@/app/types/blog";
import {
  useBlogs,
  useToggleBlogStatus,
  useDeleteBlog,
} from "@/hooks/useBlogs";

import { BlogPageHeader } from "@/components/admin/blog/BlogPageHeader";
import { BlogTable } from "@/components/admin/blog/BlogTable";
import { BlogDeleteDialog } from "@/components/admin/blog/BlogDeleteDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function BlogsAdminPage() {
  const [deleteTarget, setDeleteTarget] = useState<BlogListItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data: blogs = [], isLoading, isError, error, refetch } = useBlogs();
  const toggleStatus = useToggleBlogStatus();
  const deleteBlog = useDeleteBlog();

  const handleToggleStatus = async (id: string) => {
    if (togglingId) return;
    setTogglingId(id);
    try {
      const updated = await toggleStatus.mutateAsync(id);
      toast.success(
        updated.isActive
          ? "Blog post published (ACTIVE on storefront)"
          : "Blog post unpublished (Draft)"
      );
    } catch (err: any) {
      toast.error("Could not toggle status: " + (err?.message || "Network error"));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteBlog.mutateAsync(id);
      toast.success("Blog post has been deleted permanently");
    } catch (err: any) {
      toast.error("Failed to delete post: " + (err?.message || "Server error"));
      throw err;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <BlogPageHeader />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
            >
              <div className="flex items-center gap-4 w-full">
                <Skeleton className="w-24 h-24 rounded-xl bg-[#F8E7D2]/80 shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-3/4 max-w-md bg-[#F8E7D2]/80" />
                  <Skeleton className="h-4 w-full max-w-2xl bg-[#F8E7D2]/60" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-5 w-16 rounded-md bg-[#F8E7D2]/60" />
                    <Skeleton className="h-5 w-20 rounded-md bg-[#F8E7D2]/60" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Skeleton className="h-6 w-16 rounded-full bg-[#F8E7D2]/80" />
                <Skeleton className="h-8 w-8 rounded-xl bg-[#F8E7D2]/80" />
                <Skeleton className="h-8 w-8 rounded-xl bg-[#F8E7D2]/80" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load Blog Posts</h3>
          <p className="text-sm text-red-600 mb-5">{error?.message || "Unknown error"}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : (
        <BlogTable
          blogs={blogs}
          togglingId={togglingId}
          onToggleStatus={handleToggleStatus}
          onDelete={(target) => setDeleteTarget(target)}
        />
      )}

      <BlogDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        blog={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
