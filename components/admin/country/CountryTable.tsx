"use client";

import { Country } from "@/app/types/country";
import { Globe, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CountryTableProps {
  countries: Country[];
  onEdit: (country: Country) => void;
  onDelete: (country: Country) => void;
  onAddFirst: () => void;
}

export function CountryTable({
  countries,
  onEdit,
  onDelete,
  onAddFirst,
}: CountryTableProps) {
  if (countries.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#914A8C]/25 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] mb-4 shadow-inner">
          <Globe className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 tracking-wide mb-2">
          No Countries Yet
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 font-medium leading-relaxed">
          Create your first country to set up pricing rules.
        </p>
        <button
          onClick={onAddFirst}
          className="px-6 py-3 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        >
          + Add First Country
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#914A8C]/15 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#F8E7D2]/40 border-b border-[#914A8C]/15 text-[#914A8C] text-xs uppercase tracking-wider font-bold">
            <th className="p-4 w-16 text-center">Flag</th>
            <th className="p-4">Country Name</th>
            <th className="p-4">Code</th>
            <th className="p-4">Currency</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {countries.map((country) => (
            <tr
              key={country.id}
              className="border-b border-[#914A8C]/10 hover:bg-[#F8E7D2]/10 transition-colors"
            >
              <td className="p-4 text-center">
                {country.flagUrl ? (
                  <img
                    src={country.flagUrl}
                    alt={`${country.name} flag`}
                    className="w-8 h-6 object-cover rounded shadow-sm inline-block"
                  />
                ) : (
                  <div className="w-8 h-6 bg-neutral-200 rounded inline-block" />
                )}
              </td>
              <td className="p-4 font-bold text-neutral-800">{country.name}</td>
              <td className="p-4">
                <span className="px-2 py-1 bg-neutral-100 border border-neutral-200 text-neutral-700 font-mono text-xs rounded-md">
                  {country.code}
                </span>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-neutral-100 border border-neutral-200 text-neutral-700 font-mono text-xs rounded-md">
                  {country.currencyCode}
                </span>
              </td>
              <td className="p-4">
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase tracking-wide inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Active
                </span>
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(country)}
                    className="h-8 w-8 rounded-lg text-neutral-600 hover:text-[#914A8C] hover:border-[#914A8C] transition-colors"
                    title="Edit Country"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(country)}
                    className="h-8 w-8 rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                    title="Delete Country"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
