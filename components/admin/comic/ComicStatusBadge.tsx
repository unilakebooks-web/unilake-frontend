import { ComicStatus } from "@/app/types/comic";
import { cn } from "@/lib/utils";

interface ComicStatusBadgeProps {
  status: ComicStatus;
  className?: string;
}

export function ComicStatusBadge({ status, className }: ComicStatusBadgeProps) {
  let label = status as string;
  let colorClass = "";

  switch (status) {
    case ComicStatus.PUBLISHED:
      colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
      break;
    case ComicStatus.DRAFT:
      colorClass = "bg-amber-100 text-amber-800 border-amber-200";
      break;
    case ComicStatus.UNPUBLISHED:
      colorClass = "bg-neutral-100 text-neutral-600 border-neutral-200";
      break;
    case ComicStatus.PUBLISHING:
      colorClass = "bg-blue-100 text-blue-800 border-blue-200 animate-pulse";
      label = "PUBLISHING...";
      break;
    default:
      colorClass = "bg-neutral-100 text-neutral-600 border-neutral-200";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shadow-sm",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
