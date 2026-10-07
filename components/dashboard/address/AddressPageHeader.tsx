import { Plus } from "lucide-react";

interface AddressPageHeaderProps {
  onAddClick: () => void;
}

export function AddressPageHeader({ onAddClick }: AddressPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white/50 backdrop-blur-sm rounded-[24px] border border-[#914A8C]/20 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">
          My Addresses
        </h1>
        <p className="text-[#914A8C]/70 font-medium text-sm">
          Manage your saved shipping addresses
        </p>
      </div>
      <button
        onClick={onAddClick}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Add New Address</span>
      </button>
    </div>
  );
}
