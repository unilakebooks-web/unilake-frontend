import { useRouter } from "next/navigation";
import { MoreHorizontal, Edit, Globe, EyeOff, FileArchive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ComicStatus } from "@/app/types/comic";
import { useUpdateComicStatus } from "@/hooks/useComics";
import { toast } from "sonner";

interface ComicRowActionsProps {
  comicId: string;
  status: ComicStatus;
  orderSessionsCount: number;
  onDeleteClick: () => void;
}

/**
 * Why Delete is disabled. Deliberately broad: the block applies to ANY customer
 * session on the comic — an abandoned or expired preview counts just as much as
 * a delivered order, because each session (and any order from it) points back
 * at the comic and the database refuses to delete a comic still referenced.
 */
const DELETE_BLOCKED_REASON =
  "This comic can't be deleted because customers have already personalised it (previews or orders). Unpublish it or revert it to Draft to hide it instead.";

export function ComicRowActions({ comicId, status, orderSessionsCount, onDeleteClick }: ComicRowActionsProps) {
  const router = useRouter();
  const deleteBlocked = orderSessionsCount > 0;
  const { mutateAsync: updateStatus } = useUpdateComicStatus();

  const handleStatusChange = async (newStatus: ComicStatus) => {
    try {
      await updateStatus({ id: comicId, status: newStatus });
      toast.success(`Comic status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update comic status");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-8 w-8 p-0 rounded-lg hover:bg-neutral-100 flex items-center justify-center outline-none">
        <MoreHorizontal className="h-4 w-4 text-neutral-600" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 bg-white border border-neutral-100 shadow-xl">
        <DropdownMenuItem 
          onClick={() => router.push(`/admin/comics/${comicId}`)}
          className="rounded-lg cursor-pointer font-medium p-2.5"
        >
          <Edit className="w-4 h-4 mr-2 text-neutral-500" />
          View / Edit Details
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-neutral-100 my-1" />

        {(status === ComicStatus.DRAFT || status === ComicStatus.UNPUBLISHED) && (
          <DropdownMenuItem 
            onClick={() => handleStatusChange(ComicStatus.PUBLISHED)}
            className="rounded-lg cursor-pointer font-medium p-2.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <Globe className="w-4 h-4 mr-2" />
            Publish Comic
          </DropdownMenuItem>
        )}

        {status === ComicStatus.PUBLISHED && (
          <DropdownMenuItem 
            onClick={() => handleStatusChange(ComicStatus.UNPUBLISHED)}
            className="rounded-lg cursor-pointer font-medium p-2.5 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Unpublish
          </DropdownMenuItem>
        )}

        {status === ComicStatus.UNPUBLISHED && (
          <DropdownMenuItem 
            onClick={() => handleStatusChange(ComicStatus.DRAFT)}
            className="rounded-lg cursor-pointer font-medium p-2.5 text-neutral-600 hover:bg-neutral-100"
          >
            <FileArchive className="w-4 h-4 mr-2" />
            Revert to Draft
          </DropdownMenuItem>
        )}

        {status !== ComicStatus.PUBLISHED && (
          <>
            <DropdownMenuSeparator className="bg-neutral-100 my-1" />
            {deleteBlocked ? (
              <>
                {/* A disabled menu item ignores the pointer (pointer-events:
                    none), so it can't trigger a tooltip itself — the hover
                    lands on this wrapper instead. Opens to the left so it
                    doesn't cover the menu. */}
                <Tooltip>
                  <TooltipTrigger render={<div className="cursor-not-allowed" />}>
                    <DropdownMenuItem
                      disabled
                      className="rounded-lg font-medium p-2.5 text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Permanently
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[260px] leading-snug">
                    {DELETE_BLOCKED_REASON}
                  </TooltipContent>
                </Tooltip>
                {/* The same reason in short, always visible — touch screens
                    have no hover, so the tooltip alone would never show. */}
                <p className="px-2.5 pb-2 -mt-1 text-[11px] leading-snug text-neutral-500">
                  Can&apos;t delete — customers have already personalised this comic.
                </p>
              </>
            ) : (
              <DropdownMenuItem
                onClick={onDeleteClick}
                className="rounded-lg cursor-pointer font-medium p-2.5 text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
