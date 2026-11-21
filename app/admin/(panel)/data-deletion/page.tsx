"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/utils";
import { useDataDeletion } from "@/hooks/useDataDeletion";
import { CanaryCard } from "@/components/admin/dataDeletion/CanaryCard";
import { GroupCard } from "@/components/admin/dataDeletion/GroupCard";
import { card } from "@/components/admin/emails/EmailField";

export default function DataDeletionAdminPage() {
  const overview = useDataDeletion();

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Data deletion</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Photos, previews and books are deleted automatically after a set time.
          Each group starts in Report only mode: read its report before
          switching it on.
        </p>
      </div>

      {overview.isError && overview.data ? (
        <div
          role="alert"
          className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-3"
        >
          <span>
            Could not refresh just now ({getErrorMessage(overview.error, "Unknown error")}). The figures below may be out of date.
          </span>
          <Button size="sm" variant="outline" onClick={() => overview.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

      {overview.isError && !overview.data ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center text-red-800 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">
            Failed to load data deletion
          </h3>
          <p className="text-sm text-red-600 mb-5">
            {getErrorMessage(overview.error, "Unknown error")}
          </p>
          <Button
            onClick={() => overview.refetch()}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Try again
          </Button>
        </div>
      ) : overview.isLoading || !overview.data ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={card}>
              <Skeleton className="h-6 w-48 bg-[#F8E7D2]/80" />
              <Skeleton className="h-10 w-full mt-4 bg-[#F8E7D2]/60" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <CanaryCard canary={overview.data.canary} />

          <section className={card}>
            <h2 className="text-lg font-bold text-neutral-900">
              Paid after deletion: {overview.data.paidAfterDeletionOrders}
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Orders paid after the photo and files were deleted. No book can be
              made for them: contact the customer for a new photo or a refund.
              Each one is marked on its order page.
            </p>
          </section>

          {overview.data.groups.map((group) => (
            <GroupCard key={group.group} group={group} />
          ))}
        </>
      )}
    </div>
  );
}
