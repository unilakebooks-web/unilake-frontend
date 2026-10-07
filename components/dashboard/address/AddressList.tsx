import { MapPin, Plus } from "lucide-react";
import type { SavedAddress } from "@/app/types/address";
import { AddressCard } from "./AddressCard";

interface AddressListProps {
  addresses: SavedAddress[];
  onEdit: (address: SavedAddress) => void;
  onDelete: (address: SavedAddress) => void;
  onSetDefault: (id: string) => void;
  onAddFirst: () => void;
}

export function AddressList({ addresses, onEdit, onDelete, onSetDefault, onAddFirst }: AddressListProps) {
  if (addresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-sm rounded-[24px] border-2 border-dashed border-[#914A8C]/30 min-h-[400px] text-center">
        <div className="w-16 h-16 bg-[#914A8C]/10 rounded-full flex items-center justify-center mb-4 text-[#914A8C]">
          <MapPin size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No addresses yet</h2>
        <p className="text-gray-500 max-w-sm mb-6">
          Save your shipping addresses here for faster checkout when creating new storybooks.
        </p>
        <button
          onClick={onAddFirst}
          className="flex items-center gap-2 px-6 py-3 bg-[#914A8C] hover:bg-[#7a3e75] text-white font-bold rounded-xl transition-all shadow-[0_4px_0_0_#5a2b56] hover:translate-y-1 hover:shadow-[0_0px_0_0_#5a2b56] cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add your first address</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetDefault={onSetDefault}
        />
      ))}
    </div>
  );
}
