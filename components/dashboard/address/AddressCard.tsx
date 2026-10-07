import { MapPin, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import type { SavedAddress } from "@/app/types/address";

interface AddressCardProps {
  address: SavedAddress;
  onEdit: (address: SavedAddress) => void;
  onDelete: (address: SavedAddress) => void;
  onSetDefault: (id: string) => void;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <div className="flex flex-col p-6 bg-white rounded-2xl border-2 border-[#914A8C]/20 shadow-sm relative overflow-hidden transition-all hover:border-[#914A8C]/40">
      {/* Default Badge */}
      {address.isDefault && (
        <div className="absolute top-0 right-0 bg-[#914A8C] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg">
          Default
        </div>
      )}

      <div className="flex-1 space-y-3">
        {/* Header: Label & Name */}
        <div>
          {address.label && (
            <span className="inline-block px-2.5 py-1 mb-2 text-xs font-semibold text-[#914A8C] bg-[#914A8C]/10 rounded-md uppercase tracking-wide">
              {address.label}
            </span>
          )}
          <h3 className="font-bold text-gray-900 text-lg">{address.name}</h3>
        </div>

        {/* Address Body */}
        <div className="text-sm text-gray-600 space-y-1">
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city}, {address.state} {address.zip}
          </p>
          <p className="font-medium text-gray-800">{address.country}</p>
        </div>

        {/* Phone */}
        <div className="text-sm text-gray-500 flex items-center gap-2 pt-1">
          <span className="font-medium">Phone:</span>
          {address.phone}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(address)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-500 hover:bg-[#914A8C]/10 hover:text-[#914A8C] transition-colors cursor-pointer"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(address)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
        
        {!address.isDefault && (
          <button
            onClick={() => onSetDefault(address.id)}
            className="text-xs font-semibold text-[#914A8C] hover:text-[#7a3e75] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            Set as Default
          </button>
        )}
      </div>
    </div>
  );
}
