"use client";

import { useState } from "react";
import { useThemes, useCreateTheme, useUpdateTheme, useDeleteTheme } from "@/hooks/useThemes";
import { Theme } from "@/app/types/theme";

import { ThemePageHeader } from "@/components/admin/theme/ThemePageHeader";
import { ThemeTable } from "@/components/admin/theme/ThemeTable";
import { ThemeModal } from "@/components/admin/theme/ThemeModal";
import { ThemeDeleteDialog } from "@/components/admin/theme/ThemeDeleteDialog";

import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function ThemesPage() {
  const { data: themes, isLoading, error, refetch } = useThemes();
  
  const createMutation = useCreateTheme();
  const updateMutation = useUpdateTheme();
  const deleteMutation = useDeleteTheme();

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    target: Theme | null;
  }>({
    open: false,
    mode: "create",
    target: null,
  });

  const [deleteTarget, setDeleteTarget] = useState<Theme | null>(null);

  const handleSave = async (name: string) => {
    if (modalState.mode === "create") {
      await createMutation.mutateAsync(name);
      toast.success("Theme created successfully");
    } else if (modalState.mode === "edit" && modalState.target) {
      await updateMutation.mutateAsync({
        id: modalState.target.id,
        name,
      });
      toast.success("Theme updated successfully");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    toast.success("Theme deleted successfully");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <ThemePageHeader
        onAddClick={() =>
          setModalState({ open: true, mode: "create", target: null })
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-48 bg-[#F8E7D2]/80" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-12 bg-[#F8E7D2]/80" />
                <Skeleton className="h-6 w-12 bg-[#F8E7D2]/80" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load Themes</h3>
          <p className="text-sm text-red-600 mb-5">{(error as any)?.message || "Network error"}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <ThemeTable
          themes={themes || []}
          onEdit={(target) => setModalState({ open: true, mode: "edit", target })}
          onDelete={(target) => setDeleteTarget(target)}
          onAddFirst={() => setModalState({ open: true, mode: "create", target: null })}
        />
      )}

      <ThemeModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
        mode={modalState.mode}
        initialData={modalState.target}
        onSave={handleSave}
      />

      <ThemeDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        theme={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
