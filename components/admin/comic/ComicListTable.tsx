import { format } from "date-fns";
import { ComicListItem } from "@/app/types/comic";
import { ComicStatusBadge } from "./ComicStatusBadge";
import { ComicRowActions } from "./ComicRowActions";
import { AlertCircle, FileImage, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatAgeGroup } from "@/lib/comicTags";

interface ComicListTableProps {
  comics: ComicListItem[];
  onDeleteClick: (comic: ComicListItem) => void;
}

export function ComicListTable({ comics, onDeleteClick }: ComicListTableProps) {
  const router = useRouter();

  if (comics.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-12 text-center flex flex-col items-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#F8E7D2] flex items-center justify-center mb-4">
          <FileImage className="w-8 h-8 text-[#914A8C]" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">No Comics Yet</h3>
        <p className="text-neutral-500 mb-6 max-w-md">
          Start building your catalogue by creating your first comic.
        </p>
        <Button 
          onClick={() => router.push("/admin/comics/new")}
          className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white shadow-sm font-semibold px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Comic
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#914A8C]/5 text-[#914A8C] font-semibold border-b border-[#914A8C]/10 uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4 rounded-tl-3xl">Comic</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 hidden md:table-cell">Gender & Age</th>
              <th className="px-6 py-4 text-center">Pages</th>
              <th className="px-6 py-4 hidden lg:table-cell">Theme</th>
              <th className="px-6 py-4 hidden sm:table-cell">Created</th>
              <th className="px-4 py-4 rounded-tr-3xl text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-700">
            {comics.map((comic) => (
              <tr key={comic.id} className="hover:bg-white/50 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-14 bg-neutral-200 rounded overflow-hidden shadow-sm shrink-0 border border-neutral-200">
                      {comic.coverThumbnailUrls?.[0] ? (
                        <img src={comic.coverThumbnailUrls[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                          <FileImage className="w-4 h-4 text-neutral-300" />
                        </div>
                      )}
                    </div>
                    <div className="max-w-[200px] sm:max-w-[300px]">
                      <div 
                        className="font-bold text-neutral-900 truncate hover:text-[#914A8C] cursor-pointer"
                        onClick={() => router.push(`/admin/comics/${comic.id}`)}
                      >
                        {comic.title}
                      </div>
                      {comic.isBestseller && (
                        <span className="inline-block mt-1 text-[10px] bg-yellow-100 text-yellow-800 font-bold px-1.5 rounded">
                          BESTSELLER
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <ComicStatusBadge status={comic.status} />
                </td>
                <td className="px-6 py-3 hidden md:table-cell">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {comic.genderTags.map((gender) => (
                      <span
                        key={gender}
                        className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100"
                      >
                        {gender}
                      </span>
                    ))}
                    {comic.ageGroups.length > 0 && (
                      <span className="text-xs text-neutral-500 whitespace-nowrap">
                        {comic.ageGroups.map(formatAgeGroup).join(", ")} yrs
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="font-semibold text-neutral-900">{comic._count.pages}</span>
                    <span className="text-neutral-400">/</span>
                    <span className="text-neutral-500">{comic.pageCount}</span>
                    {comic._count.pages !== comic.pageCount && (
                      <div className="w-2 h-2 rounded-full bg-amber-400 ml-1" title="Missing pages" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 hidden lg:table-cell">
                  {comic.themes.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {comic.themes.map((theme) => (
                        <span
                          key={theme.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-100"
                        >
                          {theme.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-6 py-3 hidden sm:table-cell whitespace-nowrap text-xs text-neutral-500">
                  {format(new Date(comic.createdAt), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 text-right">
                  <ComicRowActions
                    comicId={comic.id}
                    status={comic.status}
                    orderSessionsCount={comic._count.orderSessions}
                    onDeleteClick={() => onDeleteClick(comic)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
