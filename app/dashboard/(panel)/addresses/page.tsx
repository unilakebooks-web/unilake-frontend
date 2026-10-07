"use client";

import { useState } from "react";
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from "@/hooks/useAddresses";
import type { SavedAddress, CreateAddressInput, UpdateAddressInput } from "@/app/types/address";

import { AddressPageHeader } from "@/components/dashboard/address/AddressPageHeader";
import { AddressList } from "@/components/dashboard/address/AddressList";
import { AddressFormModal } from "@/components/dashboard/address/AddressFormModal";
import { AddressDeleteDialog } from "@/components/dashboard/address/AddressDeleteDialog";

import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AddressesPage() {
  const { data: addresses, isLoading, error, refetch } = useAddresses();
  
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    target: SavedAddress | null;
  }>({
    open: false,
    mode: "create",
    target: null,
  });

  const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null);

  const handleSave = async (data: CreateAddressInput | UpdateAddressInput) => {
    if (modalState.mode === "create") {
      await createMutation.mutateAsync(data as CreateAddressInput);
      toast.success("Address saved successfully");
    } else if (modalState.mode === "edit" && modalState.target) {
      await updateMutation.mutateAsync({
        id: modalState.target.id,
        input: data as UpdateAddressInput,
      });
      toast.success("Address updated successfully");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    toast.success("Address deleted successfully");
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultMutation.mutateAsync(id);
    toast.success("Default address updated");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 font-poppins">
      <AddressPageHeader
        onAddClick={() =>
          setModalState({ open: true, mode: "create", target: null })
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15 space-y-4"
            >
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-32 bg-[#F8E7D2]/80" />
                <Skeleton className="h-4 w-12 rounded-full bg-[#F8E7D2]/80" />
              </div>
              <Skeleton className="h-4 w-3/4 bg-[#F8E7D2]/80" />
              <Skeleton className="h-4 w-1/2 bg-[#F8E7D2]/80" />
              <Skeleton className="h-4 w-2/3 bg-[#F8E7D2]/80" />
              <div className="pt-4 border-t border-gray-100 flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full bg-[#F8E7D2]/80" />
                <Skeleton className="h-8 w-8 rounded-full bg-[#F8E7D2]/80" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load addresses</h3>
          <p className="text-sm text-red-600 mb-5">{(error as any)?.message || "Network error"}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <AddressList
          addresses={addresses || []}
          onEdit={(target) => setModalState({ open: true, mode: "edit", target })}
          onDelete={(target) => setDeleteTarget(target)}
          onSetDefault={handleSetDefault}
          onAddFirst={() => setModalState({ open: true, mode: "create", target: null })}
        />
      )}

      <AddressFormModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
        mode={modalState.mode}
        initialData={modalState.target}
        onSave={handleSave}
      />

      <AddressDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        address={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
