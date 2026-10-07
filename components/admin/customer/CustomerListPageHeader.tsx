import { Contact } from "lucide-react";

export function CustomerListPageHeader({
  total,
}: {
  /** Customers matching the current search. Undefined while loading. */
  total?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-[#914A8C]/10 flex items-center justify-center shrink-0">
        <Contact className="w-6 h-6 text-[#914A8C]" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">Customers</h1>
        <p className="text-sm font-semibold text-neutral-500">
          {total === undefined
            ? "Loading customers…"
            : `${total} ${total === 1 ? "customer" : "customers"} who bought a book`}
        </p>
      </div>
    </div>
  );
}
