import { BlogListItem } from "@/app/types/blog";
import { Switch } from "@/components/ui/switch";
import { Edit2, Trash2, FileText, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BlogTableProps {
  blogs: BlogListItem[];
  togglingId: string | null;
  onToggleStatus: (id: string) => void;
  onDelete: (blog: BlogListItem) => void;
}

export function BlogTable({ blogs, togglingId, onToggleStatus, onDelete }: BlogTableProps) {
  if (blogs.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#914A8C]/25 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] mb-4 shadow-inner">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 tracking-wide mb-2">
          No Blog Posts Yet
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 font-medium leading-relaxed">
          Create your first blog post to share updates, news, and stories with your audience.
        </p>
        <Link
          href="/admin/blogs/new"
          className="px-6 py-3 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm shadow-md transition-all duration-200 hover:scale-[1.02] cursor-pointer inline-block"
        >
          + Create First Post
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {blogs.map((blog) => (
        <div
          key={blog.id}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15 hover:border-[#914A8C]/40 hover:shadow-md transition-all duration-200"
        >
          {/* Left side: Content */}
          <div className="flex items-start md:items-center gap-4 flex-1 overflow-hidden">
            <div className="w-24 h-24 rounded-xl bg-gray-100 border border-gray-200 shrink-0 overflow-hidden relative flex items-center justify-center">
              {blog.coverImageUrl ? (
                <Image
                  src={blog.coverImageUrl}
                  alt={blog.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <div className="flex flex-col min-w-0">
              <h3 className="font-bold text-gray-900 truncate pr-4 text-lg">
                {blog.title}
              </h3>
              
              {blog.excerpt && (
                <p className="text-gray-500 text-sm line-clamp-1 mt-0.5 max-w-2xl">
                  {blog.excerpt}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(blog.createdAt).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {blog.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                        {tag}
                      </span>
                    ))}
                    {blog.tags.length > 3 && (
                      <span className="text-xs text-gray-400 font-medium">
                        +{blog.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
            <div className="flex items-center gap-2 mr-4">
              <Switch
                checked={blog.isActive}
                onCheckedChange={() => onToggleStatus(blog.id)}
                disabled={togglingId === blog.id}
                className="data-[state=checked]:bg-[#914A8C]"
              />
              <span
                className={cn(
                  "text-xs font-bold uppercase tracking-wider min-w-[60px]",
                  blog.isActive ? "text-[#914A8C]" : "text-gray-400"
                )}
              >
                {blog.isActive ? "Published" : "Draft"}
              </span>
            </div>

            <div className="flex gap-1">
              <Link
                href={`/admin/blogs/${blog.id}`}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="Edit Post"
              >
                <Edit2 className="w-5 h-5" />
              </Link>
              
              <button
                onClick={() => onDelete(blog)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Delete Post"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
