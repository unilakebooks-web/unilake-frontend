import { Heart } from "lucide-react";

export default function WishlistPage() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Heart className="mx-auto h-16 w-16 text-[#914A8C]/30" />
        <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">
          Wishlist
        </h1>
        <p className="text-sm font-semibold text-[#914A8C]/70">
          🚧 Coming Soon
        </p>
      </div>
    </div>
  );
}
