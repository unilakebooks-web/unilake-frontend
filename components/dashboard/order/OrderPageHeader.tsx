export function OrderPageHeader({ count }: { count?: number }) {
  return (
    <div className="p-6 bg-white/50 backdrop-blur-sm rounded-[24px] border border-[#914A8C]/20 shadow-sm">
      <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">My Orders</h1>
      <p className="text-[#914A8C]/70 font-medium text-sm mt-1">
        {count === undefined
          ? "Loading your orders…"
          : count === 0
            ? "Your personalised books will appear here"
            : `${count} ${count === 1 ? "order" : "orders"}`}
      </p>
    </div>
  );
}
