"use client";

import { useState } from "react";
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useToggleCouponStatus,
  useDeleteCoupon,
  useGenerateCoupons,
} from "@/hooks/useCoupons";
import type { Coupon, CouponInput, GenerateCouponsInput } from "@/app/types/coupon";

import { CouponPageHeader } from "@/components/admin/coupon/CouponPageHeader";
import { CouponTable } from "@/components/admin/coupon/CouponTable";
import { CouponModal, type CouponModalMode } from "@/components/admin/coupon/CouponModal";
import { CouponDeleteDialog } from "@/components/admin/coupon/CouponDeleteDialog";

import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const updateMutation = useUpdateCoupon();
  const toggleMutation = useToggleCouponStatus();
  const deleteMutation = useDeleteCoupon();
  const generateMutation = useGenerateCoupons();

  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: CouponModalMode;
    target: Coupon | null;
  }>({ open: false, mode: "create", target: null });

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  const handleSave = async (payload: CouponInput | GenerateCouponsInput) => {
    if (modalState.mode === "generate") {
      const created = await generateMutation.mutateAsync(payload as GenerateCouponsInput);
      toast.success(`${created.length} codes generated`);
    } else if (modalState.mode === "create") {
      await createMutation.mutateAsync(payload as CouponInput);
      toast.success("Coupon created successfully");
    } else if (modalState.target) {
      await updateMutation.mutateAsync({ id: modalState.target.id, data: payload as CouponInput });
      toast.success("Coupon updated successfully");
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await toggleMutation.mutateAsync(coupon.id);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to change the coupon status"));
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    toast.success("Coupon deleted successfully");
  };

  const openCreate = () => setModalState({ open: true, mode: "create", target: null });
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <CouponPageHeader
        onAddClick={openCreate}
        onGenerateClick={() => setModalState({ open: true, mode: "generate", target: null })}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by code or name"
          aria-label="Search coupons"
          className="sm:max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | "active" | "inactive");
            setPage(1);
          }}
          aria-label="Filter by status"
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm font-medium"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

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
            togglingId={toggleMutation.isPending ? (toggleMutation.variables ?? null) : null}
            onEdit={(target) => setModalState({ open: true, mode: "edit", target })}
            onDelete={(target) => setDeleteTarget(target)}
            onToggle={handleToggle}
            onAddFirst={openCreate}
          />
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm font-medium text-neutral-600">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} coupons)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)} className="cursor-pointer">
                  Previous
                </Button>
                <Button variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="cursor-pointer">
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <CouponModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, open }))}
        mode={modalState.mode}
        initialData={modalState.target}
        onSave={handleSave}
      />

      <CouponDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        coupon={deleteTarget}
        onConfirm={handleDelete}
      />
    </div>
  );
}
