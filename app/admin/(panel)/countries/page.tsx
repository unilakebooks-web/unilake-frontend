"use client";

import { useState } from "react";
import { useCountries, useCreateCountry, useUpdateCountry, useDeleteCountry } from "@/hooks/useCountries";
import { Country } from "@/app/types/country";

import { CountryPageHeader } from "@/components/admin/country/CountryPageHeader";
import { CountryTable } from "@/components/admin/country/CountryTable";
import { CountryModal } from "@/components/admin/country/CountryModal";
import { CountryDeleteDialog } from "@/components/admin/country/CountryDeleteDialog";

import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function CountriesPage() {
  const { data: countries, isLoading, error, refetch } = useCountries();
  
  const createMutation = useCreateCountry();
  const updateMutation = useUpdateCountry();
  const deleteMutation = useDeleteCountry();

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    target: Country | null;
  }>({
    open: false,
    mode: "create",
    target: null,
  });

  const [deleteTarget, setDeleteTarget] = useState<Country | null>(null);

  const handleSave = async (data: {
    code: string;
    name: string;
    currencyCode: string;
    flagKey?: string;
  }) => {
    if (modalState.mode === "create") {
      // Create requires flagKey (checked in modal)
      await createMutation.mutateAsync({
        code: data.code,
        name: data.name,
        currencyCode: data.currencyCode,
        flagKey: data.flagKey!,
      });
      toast.success("Country created successfully");
    } else if (modalState.mode === "edit" && modalState.target) {
      await updateMutation.mutateAsync({
        id: modalState.target.id,
        data,
      });
      toast.success("Country updated successfully");
    }
  };

  const handleDelete = async (id: string) => {
    const { deletedPricingRules } = await deleteMutation.mutateAsync(id);

    // Name the cascade when there was one — the admin just destroyed pricing
    // for every comic sold in that country and should see it confirmed.
    toast.success(
      deletedPricingRules > 0
        ? `Country deleted — ${deletedPricingRules} pricing rule${
            deletedPricingRules === 1 ? "" : "s"
          } also removed`
        : "Country deleted successfully"
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <CountryPageHeader
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
                <Skeleton className="w-8 h-6 rounded bg-[#F8E7D2]/80" />
                <Skeleton className="h-5 w-32 bg-[#F8E7D2]/80" />
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
          <h3 className="font-bold text-lg mb-1">Failed to load Countries</h3>
          <p className="text-sm text-red-600 mb-5">{(error as any)?.message || "Network error"}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <CountryTable
          countries={countries || []}
          onEdit={(target) => setModalState({ open: true, mode: "edit", target })}
          onDelete={(target) => setDeleteTarget(target)}
          onAddFirst={() => setModalState({ open: true, mode: "create", target: null })}
        />
      )}

      <CountryModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
        mode={modalState.mode}
        initialData={modalState.target}
        onSave={handleSave}
      />

      <CountryDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        country={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
