"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { HeroImage } from "@/app/types/heroimage";
import {
  fetchHeroImages,
  toggleHeroImageStatus,
  deleteHeroImage,
} from "@/app/actions/heroimage";

import { HeroSlidePageHeader } from "@/components/admin/heroimage/HeroSlidePageHeader";
import { HeroSlideGrid } from "@/components/admin/heroimage/HeroSlideGrid";
import { HeroSlideUploadModal } from "@/components/admin/heroimage/HeroSlideUploadModal";
import { HeroSlideDeleteDialog } from "@/components/admin/heroimage/HeroSlideDeleteDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function HeroSlidesAdminPage() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // In-flight state trackers
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Dialog state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<HeroImage | null>(null);

  // Load hero slide banners from backend (all rows, active + inactive)
  const loadHeroImages = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchHeroImages();
      setHeroImages(data);
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to fetch hero slide list";
      setFetchError(errorMsg);
      toast.error("Could not load homepage hero slides: " + errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHeroImages();
  }, [loadHeroImages]);

  // Handle successful upload (newest first, prepend to top of list)
  const handleUploadSuccess = (newImage: HeroImage) => {
    setHeroImages((prev) => [newImage, ...prev]);
  };

  // Handle blind toggle status endpoint (disable mid-flight, derive state purely from response)
  const handleToggleStatus = async (id: string) => {
    if (togglingId) return;
    setTogglingId(id);
    try {
      const updated = await toggleHeroImageStatus(id);
      setHeroImages((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(
        updated.isActive
          ? "Hero slide published (ACTIVE on storefront)"
          : "Hero slide hidden from carousel"
      );
    } catch (err: any) {
      toast.error("Could not toggle slide status: " + (err?.message || "Network error"));
    } finally {
      setTogglingId(null);
    }
  };

  // Handle permanent deletion
  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteHeroImage(id);
      toast.success("Hero slide deleted permanently");
      setHeroImages((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      toast.error("Failed to delete hero slide: " + (err?.message || "Server error"));
      throw err;
    }
  };

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto py-2 px-4">
      {/* Page Layout Header */}
      <HeroSlidePageHeader onAddClick={() => setIsUploadOpen(true)} />

      {/* Main Container Area: Loading / Error / Card Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-[#914A8C]/15 overflow-hidden shadow-sm flex flex-col"
            >
              <Skeleton className="w-full aspect-[16/9] bg-[#F8E7D2]/60" />
              <div className="p-4 flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-32 bg-[#F8E7D2]/80" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded-xl bg-[#F8E7D2]/80" />
                  <Skeleton className="h-8 w-9 rounded-xl bg-[#F8E7D2]/80" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : fetchError ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center text-red-800 flex flex-col items-center justify-center min-h-[320px] shadow-xs">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h3 className="font-extrabold text-xl mb-1">Failed to load Hero Slides</h3>
          <p className="text-sm font-semibold text-red-600 mb-6 max-w-md">{fetchError}</p>
          <button
            onClick={loadHeroImages}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-transform active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      ) : (
        <HeroSlideGrid
          heroImages={heroImages}
          togglingId={togglingId}
          onToggleStatus={handleToggleStatus}
          onDelete={(target) => setDeleteTarget(target)}
          onAddFirst={() => setIsUploadOpen(true)}
        />
      )}

      {/* 3-Step R2 Direct Upload Modal */}
      <HeroSlideUploadModal
        open={isUploadOpen}
        onOpenChange={(open) => setIsUploadOpen(open)}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete Safeguard Dialog */}
      <HeroSlideDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        heroImage={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
