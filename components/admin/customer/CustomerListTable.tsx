"use client";

import { format } from "date-fns";
import { Mail, Phone, UserSearch } from "lucide-react";
import type { AdminCustomerRow } from "@/app/types/customer";
import { formatMoney } from "@/lib/utils";

/** How many comic titles to list before collapsing the rest into "+N more". */
const VISIBLE_COMICS = 2;

interface CustomerListTableProps {
  customers: AdminCustomerRow[];
  /** True when a search is active — changes the empty-state wording. */
  isSearching: boolean;
}

export function CustomerListTable({ customers, isSearching }: CustomerListTableProps) {
  if (customers.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-12 text-center flex flex-col items-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#F8E7D2] flex items-center justify-center mb-4">
          <UserSearch className="w-8 h-8 text-[#914A8C]" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">No customers found</h3>
        <p className="text-neutral-500 max-w-md">
          {isSearching
            ? "No customers match your search. Try a different name, email or phone number."
            : "Customers appear here once someone pays for a book."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#914A8C]/5 text-[#914A8C] font-semibold border-b border-[#914A8C]/10 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4 rounded-tl-3xl">Customer</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4 text-center">Books</th>
              <th className="px-6 py-4 hidden md:table-cell">Total spent</th>
              <th className="px-6 py-4 hidden lg:table-cell">Comics bought</th>
              <th className="px-6 py-4 hidden sm:table-cell rounded-tr-3xl">Last purchase</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {customers.map((customer) => {
              const shownComics = customer.comicsBought.slice(0, VISIBLE_COMICS);
              const hiddenComics = customer.comicsBought.length - shownComics.length;

              return (
                <tr key={customer.userId} className="hover:bg-white/60 transition-colors align-top">
                  <td className="px-6 py-3">
                    <div className="font-bold text-neutral-900 truncate max-w-[200px]">
                      {customer.name || "—"}
                    </div>
                    <div className="text-xs text-neutral-500">
                      Customer since {format(new Date(customer.firstPurchaseAt), "MMM d, yyyy")}
                    </div>
                  </td>

                  {/* Links so the admin can email or call in one click. */}
                  <td className="px-6 py-3">
                    <a
                      href={`mailto:${customer.email}`}
                      className="flex items-center gap-1.5 text-neutral-700 hover:text-[#914A8C] max-w-[260px]"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                      <span className="truncate">{customer.email}</span>
                    </a>
                    {customer.phone ? (
                      <a
                        href={`tel:${customer.phone}`}
                        className="mt-1 flex items-center gap-1.5 text-neutral-700 hover:text-[#914A8C] whitespace-nowrap"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        {customer.phone}
                      </a>
                    ) : (
                      <div className="mt-1 flex items-center gap-1.5 text-neutral-400 text-xs">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        No phone on record
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-3 text-center font-semibold text-neutral-900">
                    {customer.ordersCount}
                  </td>

                  {/* One line per currency — never added together. */}
                  <td className="px-6 py-3 hidden md:table-cell whitespace-nowrap font-semibold text-neutral-900">
                    {customer.totals.map((t) => (
                      <div key={t.currency}>{formatMoney(t.amount, t.currency)}</div>
                    ))}
                  </td>

                  <td className="px-6 py-3 hidden lg:table-cell">
                    <div
                      className="max-w-[240px]"
                      title={customer.comicsBought.join("\n")}
                    >
                      {shownComics.map((title) => (
                        <div key={title} className="truncate">
                          {title}
                        </div>
                      ))}
                      {hiddenComics > 0 && (
                        <div className="text-xs text-neutral-500">+{hiddenComics} more</div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-3 hidden sm:table-cell whitespace-nowrap text-xs text-neutral-500">
                    {format(new Date(customer.lastPurchaseAt), "MMM d, yyyy")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
