import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { SavedAddress } from "@/app/types/address";

interface AddressDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: SavedAddress | null;
  onConfirm: (id: string) => void;
}

export function AddressDeleteDialog({
  open,
  onOpenChange,
  address,
  onConfirm,
}: AddressDeleteDialogProps) {
  if (!address) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] font-poppins rounded-3xl border-2 border-[#914A8C] p-6 shadow-xl">
        <DialogHeader className="gap-2">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2 mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-gray-900">
            Delete Address
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Are you sure you want to delete this address? This action cannot be undone.
          </DialogDescription>
          {address.isDefault && (
            <p className="text-sm font-semibold text-amber-600 bg-amber-50 p-3 rounded-lg text-center mt-2 border border-amber-200">
              This is your default address. If you delete it, a new default will be chosen automatically.
            </p>
          )}
        </DialogHeader>

        <DialogFooter className="mt-6 flex sm:justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl font-bold border-gray-300 text-gray-700 hover:bg-gray-50 h-11"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm(address.id);
              onOpenChange(false);
            }}
            className="flex-1 rounded-xl font-bold bg-red-600 hover:bg-red-700 h-11"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
