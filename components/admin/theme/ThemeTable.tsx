"use client";

import { Theme } from "@/app/types/theme";
import { Palette, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeTableProps {
  themes: Theme[];
  onEdit: (theme: Theme) => void;
  onDelete: (theme: Theme) => void;
  onAddFirst: () => void;
}

export function ThemeTable({
  themes,
  onEdit,
  onDelete,
  onAddFirst,
}: ThemeTableProps) {
  if (themes.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#914A8C]/25 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] mb-4 shadow-inner">
          <Palette className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 tracking-wide mb-2">
          No Themes Yet
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 font-medium leading-relaxed">
          Create your first theme to categorize comics.
        </p>
        <button
          onClick={onAddFirst}
          className="px-6 py-3 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer"
        >
          + Add First Theme
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-[#914A8C]/15 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#F8E7D2]/40 border-b border-[#914A8C]/15 text-[#914A8C] text-xs uppercase tracking-wider font-bold">
            <th className="p-4">Theme Name</th>
            <th className="p-4">Created Date</th>
            <th className="p-4">Last Updated</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {themes.map((theme) => (
            <tr
              key={theme.id}
              className="border-b border-[#914A8C]/10 hover:bg-[#F8E7D2]/10 transition-colors"
            >
              <td className="p-4 font-bold text-neutral-800">{theme.name}</td>
              <td className="p-4 text-neutral-600 text-sm">
                {new Date(theme.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="p-4 text-neutral-600 text-sm">
                {new Date(theme.updatedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(theme)}
                    className="h-8 w-8 rounded-lg text-neutral-600 hover:text-[#914A8C] hover:border-[#914A8C] transition-colors"
                    title="Edit Theme"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onDelete(theme)}
                    className="h-8 w-8 rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                    title="Delete Theme"
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
