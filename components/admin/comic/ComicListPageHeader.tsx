import { useRouter } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComicListPageHeader() {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#914A8C]/10 text-[#914A8C] flex items-center justify-center shadow-sm border border-[#914A8C]/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Comics</h1>
            <p className="text-sm font-medium text-neutral-500 mt-0.5">
              Manage the comic catalogue, pricing, and artwork.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={() => router.push("/admin/comics/new")}
          className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white shadow-sm font-semibold h-11 px-5 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Comic
        </Button>
      </div>
    </div>
  );
}
