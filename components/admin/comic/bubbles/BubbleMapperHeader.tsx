import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BubbleMapperHeaderProps {
  comicId: string;
  pageNumber: number;
  hasUnsavedChanges: boolean;
  hasBlockingIssue: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
  onPreview: () => void;
}

export function BubbleMapperHeader({
  comicId,
  pageNumber,
  hasUnsavedChanges,
  hasBlockingIssue,
  isSaving,
  onSave,
  onReset,
  onPreview
}: BubbleMapperHeaderProps) {
  const router = useRouter();

  // Appearance only. The page owns the actual decision and the message, since
  // that is where both flags are derived and where every other toast on this
  // screen is raised.
  const isPreviewBlocked = hasUnsavedChanges || hasBlockingIssue;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-sm p-4 rounded-3xl border border-[#914A8C]/15 shadow-sm">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => {
            if (hasUnsavedChanges && !confirm("You have unsaved changes. Leave anyway?")) return;
            router.push(`/admin/comics/${comicId}`);
          }}
          className="text-neutral-500 hover:text-neutral-900 bg-neutral-100/50 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Map Bubbles - Page {pageNumber}
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Drag to move, pull corners to resize.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Deliberately NOT `disabled` when preview is blocked: a disabled
            button swallows the click, and the page needs that click to raise a
            toast explaining why nothing happened. It is muted instead, so it
            still reads as unavailable, and the page decides what to do with the
            click. `isSaving` IS a real disable — that state is transient and
            the Save spinner already explains itself. */}
        <Button
          variant="outline"
          onClick={onPreview}
          disabled={isSaving}
          title={
            hasBlockingIssue
              ? "Some bubbles are missing dialogue or a font"
              : hasUnsavedChanges
                ? "Save your changes before previewing"
                : "See the real text render with a name of your choice"
          }
          className={cn(
            "rounded-xl border-neutral-300 font-semibold cursor-pointer",
            isPreviewBlocked && "opacity-50 hover:opacity-60"
          )}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          disabled={!hasUnsavedChanges || isSaving}
          className="rounded-xl border-neutral-300 font-semibold"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Discard Changes
        </Button>
        <Button
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving || hasBlockingIssue}
          title={hasBlockingIssue ? "Some bubbles are missing dialogue or a font" : undefined}
          className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold shadow-sm px-6"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save All</>
          )}
        </Button>
      </div>
    </div>
  );
}
