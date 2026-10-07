import { Plus } from "lucide-react";
import Link from "next/link";

export function BlogPageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-[#914A8C]/15 mb-6">
      <div>
        <h1 className="text-2xl font-black text-[#914A8C] mb-1">Blog Posts</h1>
        <p className="text-gray-500 font-medium text-sm">
          Manage articles, announcements, and news for the public blog.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/blogs/new"
          className="flex items-center gap-2 bg-[#914A8C] hover:bg-[#7A3E76] text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>New Post</span>
        </Link>
      </div>
    </div>
  );
}
