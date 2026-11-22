import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SaveOrderButton } from "@/components/admin/announcement/SaveOrderButton";

interface ComicArrangeHeaderProps {
  isOrderDirty: boolean;
  isSavingOrder: boolean;
  onSaveOrder: () => void;
}

export function ComicArrangeHeader({ isOrderDirty, isSavingOrder, onSaveOrder }: ComicArrangeHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-[#914A8C]/15 mb-4">
      <div>
        <Link
          href="/admin/comics"
          className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-[#914A8C] mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Comics
        </Link>
        <h1 className="text-2xl font-black text-[#914A8C] mb-1">Arrange Books</h1>
        <p className="text-gray-500 font-medium text-sm">
          This is the order customers see on the home page, Explore Comics and Explore more books.
          Bestseller badges do not change the order.
        </p>
      </div>
      <SaveOrderButton isDirty={isOrderDirty} isSaving={isSavingOrder} onSave={onSaveOrder} />
    </div>
  );
}
