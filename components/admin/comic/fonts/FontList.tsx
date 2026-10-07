"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ComicDetail, FontWithCount } from "@/app/types/comic";
import { Type, Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { FontUploadModal } from "@/components/admin/comic/fonts/FontUploadModal";
import { FontEditModal } from "@/components/admin/comic/fonts/FontEditModal";
import { FontDeleteDialog } from "@/components/admin/comic/fonts/FontDeleteDialog";

interface FontListProps {
  comic: ComicDetail;
}

export function FontList({ comic }: FontListProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FontWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FontWithCount | null>(null);

  const fonts = comic.fonts.map(font => {
    const bubbleCount = comic.pages.reduce((acc, page) => 
      acc + page.bubbles.filter(b => b.fontId === font.id).length, 0
    );
    return { ...font, _count: { bubbles: bubbleCount } } as FontWithCount;
  });

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Fonts</h2>
          <p className="text-sm text-neutral-500">
            Fonts used for speech bubbles in this comic.
          </p>
        </div>
        <Button 
          onClick={() => setUploadModalOpen(true)}
          className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold shadow-sm px-5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Font
        </Button>
      </div>

      {fonts.length === 0 ? (
        <div className="bg-neutral-50/50 border border-dashed border-neutral-200 rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#F8E7D2] flex items-center justify-center mb-3">
            <Type className="w-6 h-6 text-[#914A8C]" />
          </div>
          <p className="text-neutral-900 font-bold mb-1">No Fonts Yet</p>
          <p className="text-sm text-neutral-500 mb-4">
            Upload your first font to start mapping bubbles.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Font Name</th>
                  <th className="px-6 py-4">File Type</th>
                  <th className="px-6 py-4 text-center">Bubbles Using</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Uploaded</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {fonts.map((font) => {
                  const extMatch = font.fileUrl.match(/\.([a-z0-9]+)$/i);
                  const ext = extMatch ? extMatch[1].toUpperCase() : "UNKNOWN";
                  
                  return (
                    <tr key={font.id} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-3 font-bold text-neutral-900">{font.name}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 text-xs font-mono border border-neutral-200">
                          {ext}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded border border-blue-100">
                          {font._count?.bubbles || 0}
                        </span>
                      </td>
                      <td className="px-6 py-3 hidden sm:table-cell text-xs text-neutral-500">
                        {format(new Date(font.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditTarget(font)}
                            className="h-8 w-8 p-0 rounded-lg text-neutral-500 hover:text-neutral-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeleteTarget(font)}
                            className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FontUploadModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen} 
        comicId={comic.id} 
      />

      <FontEditModal 
        open={!!editTarget} 
        onOpenChange={(open: boolean) => !open && setEditTarget(null)} 
        font={editTarget} 
        comicId={comic.id}
      />

      <FontDeleteDialog 
        open={!!deleteTarget} 
        onOpenChange={(open: boolean) => !open && setDeleteTarget(null)} 
        font={deleteTarget} 
        comicId={comic.id}
      />
    </div>
  );
}
