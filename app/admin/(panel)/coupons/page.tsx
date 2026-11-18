"use client";

import { useCallback, useState } from "react";
import {
  useCoupons,
  useCreateCoupon,
  useCreateBulkCoupons,
  useUpdateCoupon,
  useToggleCouponStatus,
  useDeleteCoupon,
} from "@/hooks/useCoupons";
import type { Coupon, CouponInput } from "@/app/types/coupon";

import { CouponPageHeader } from "@/components/admin/coupon/CouponPageHeader";
import { CouponTable } from "@/components/admin/coupon/CouponTable";
import { CouponModal, type CouponModalMode } from "@/components/admin/coupon/CouponModal";
import { CouponDeleteDialog } from "@/components/admin/coupon/CouponDeleteDialog";
import { BulkCodesDialog } from "@/components/admin/coupon/BulkCodesDialog";
import { CouponListFilters } from "@/components/admin/coupon/CouponListFilters";
import { OrderPagination } from "@/components/admin/order/OrderPagination";

import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function CouponsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");

  const { data, isLoading, error, refetch } = useCoupons({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    status: status || undefined,
  });

  const createMutation = useCreateCoupon();
  const bulkMutation = useCreateBulkCoupons();
  const updateMutation = useUpdateCoupon();
  const toggleMutation = useToggleCouponStatus();
  const deleteMutation = useDeleteCoupon();

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: CouponModalMode;
    target: Coupon | null;
  }>({ open: false, mode: "create", target: null });

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  // The coupons of the batch just created, shown once so the admin can copy their codes.
  const [bulkCreated, setBulkCreated] = useState<Coupon[] | null>(null);

  const handleSave = async (payload: CouponInput) => {
    if (modalState.mode === "create") {
      const created = await createMutation.mutateAsync(payload);
      toast.success(`Coupon ${created.code} created`);
    } else if (modalState.target) {
      await updateMutation.mutateAsync({ id: modalState.target.id, data: payload });
      toast.success("Coupon updated successfully");
    }
  };

  const handleSaveBulk = async (payload: CouponInput, quantity: number) => {
    const { coupons } = await bulkMutation.mutateAsync({ payload, quantity });
    setBulkCreated(coupons);
    toast.success(`${coupons.length} coupons created`);
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      const next = !coupon.isActive;
      await toggleMutation.mutateAsync({ id: coupon.id, isActive: next });
      toast.success(`Coupon ${coupon.code} turned ${next ? "on" : "off"}`);
      // Turning the last coupon on this page out of the filter would leave an empty page.
      if (status && page > 1 && data?.coupons.length === 1) setPage(page - 1);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to change the coupon status"));
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    toast.success("Coupon deleted successfully");
    // Deleting the only coupon on the last page would leave an empty page.
    if (page > 1 && data?.coupons.length === 1) setPage(page - 1);
  };

  // Stable: CouponListFilters lists it in a debounce effect's dependencies.
  const handleFiltersChange = useCallback(
    (next: { search?: string; status?: "active" | "inactive" }) => {
      setSearch(next.search ?? "");
      setStatus(next.status ?? "");
      setPage(1); // A narrower result set makes the old page number meaningless.
    },
    []
  );

  const openCreate = () => setModalState({ open: true, mode: "create", target: null });
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <CouponPageHeader
        onAddClick={openCreate}
      />

      <CouponListFilters onFiltersChange={handleFiltersChange} />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15"
            >
              <Skeleton className="h-5 w-40 bg-[#F8E7D2]/80" />
              <Skeleton className="h-6 w-24 bg-[#F8E7D2]/80" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Failed to load Coupons</h3>
          <p className="text-sm text-red-600 mb-5">{getErrorMessage(error, "Network error")}</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <CouponTable
            coupons={data?.coupons ?? []}
            togglingId={toggleMutation.isPending ? (toggleMutation.variables?.id ?? null) : null}
            onEdit={(target) => setModalState({ open: true, mode: "edit", target })}
            onDelete={(target) => setDeleteTarget(target)}
            onToggle={handleToggle}
            onAddFirst={openCreate}
            filtered={Boolean(search.trim() || status)}
          />
          {pagination && (
            <OrderPagination pagination={pagination} onPageChange={setPage} itemLabel="coupons" />
          )}
        </>
      )}

      <CouponModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
        mode={modalState.mode}
        initialData={modalState.target}
        onSave={handleSave}
        onSaveBulk={handleSaveBulk}
      />

      <BulkCodesDialog coupons={bulkCreated} onClose={() => setBulkCreated(null)} />

      <CouponDeleteDialog
        key={deleteTarget?.id ?? "none"}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        coupon={deleteTarget}
        onConfirm={handleDelete}
        onDeactivate={async (coupon) => {
          await toggleMutation.mutateAsync({ id: coupon.id, isActive: false });
          toast.success(`Coupon ${coupon.code} turned off`);
        }}
      />
    </div>
  );
}
