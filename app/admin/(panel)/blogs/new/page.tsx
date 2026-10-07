"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCreateBlog } from "@/hooks/useBlogs";
import { requestBlogUploadUrl } from "@/app/actions/blog";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { BlogEditor } from "@/components/admin/blog/BlogEditor";
import { BlogTagInput } from "@/components/admin/blog/BlogTagInput";
import {
  CharCounter,
  SEO_TITLE_LIMIT,
  SEO_DESCRIPTION_LIMIT,
} from "@/components/admin/shared/CharCounter";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB for cover image

export default function CreateBlogPage() {
  const router = useRouter();
  const createMutation = useCreateBlog();

  // Form State
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  // Cover Image State
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverKey, setCoverKey] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Cover image must be under 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploading(true);

      const { uploadUrl, key } = await requestBlogUploadUrl(file.name, file.type);

      await uploadToR2({
        uploadUrl,
        file,
        contentType: file.type,
      });

      // Show local preview
      setCoverUrl(URL.createObjectURL(file));
      setCoverKey(key);
      toast.success("Cover image uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload cover image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setCoverUrl(null);
    setCoverKey(undefined); // undefined means "not included in payload" for create, but here it's fine.
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!body.trim() || body === "<p></p>") {
      toast.error("Blog post content is required");
      return;
    }
    if (title.length > 200) {
      toast.error("Title must be 200 characters or less");
      return;
    }
    if (excerpt.length > 300) {
      toast.error("Excerpt must be 300 characters or less");
      return;
    }

    try {
      await createMutation.mutateAsync({
        title,
        body,
        excerpt: excerpt.trim() || undefined,
        coverImageKey: coverKey,
        tags: tags.length > 0 ? tags : undefined,
        // undefined (not null) on create — the column simply stays unset, and
        // the post falls back to its own title/excerpt in search results.
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
      });

      toast.success("Blog post created successfully! (Saved as draft)");
      router.push("/admin/blogs");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create blog post");
    }
  };

  const isSaving = createMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/blogs"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Back to Blogs"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#914A8C] mb-1">Create Blog Post</h1>
            <p className="text-gray-500 font-medium text-sm">Draft a new article for the storefront blog.</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Title & Excerpt */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Post Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
              placeholder="e.g. 5 Benefits of Personalized Comic Books"
              maxLength={200}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 text-lg outline-none focus:border-[#914A8C] focus:ring-2 focus:ring-[#914A8C]/20 focus:bg-white transition-all disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>The URL slug will be automatically generated from the title.</span>
              <span>{title.length}/200</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Excerpt (Optional)</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              disabled={isSaving}
              placeholder="A short summary of the post. Appears on the blog list page."
              maxLength={300}
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#914A8C] focus:ring-2 focus:ring-[#914A8C]/20 focus:bg-white transition-all resize-none disabled:opacity-50"
            />
            <div className="text-xs text-gray-400 text-right font-medium">
              {excerpt.length}/300
            </div>
          </div>

          {/* SEO — both optional, blank falls back to title/excerpt */}
          <div className="pt-6 border-t border-gray-100 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-700">Search &amp; Sharing (SEO)</h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                What Google shows and what appears when this post is shared. Both
                optional — blank uses the title and excerpt above.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">SEO Title</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                disabled={isSaving}
                placeholder={title || "Same as the post title"}
                maxLength={120}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#914A8C] focus:ring-2 focus:ring-[#914A8C]/20 focus:bg-white transition-all disabled:opacity-50"
              />
              <div className="flex justify-end">
                <CharCounter value={metaTitle} limit={SEO_TITLE_LIMIT} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">SEO Description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                disabled={isSaving}
                placeholder={excerpt || "Same as the excerpt"}
                maxLength={320}
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#914A8C] focus:ring-2 focus:ring-[#914A8C]/20 focus:bg-white transition-all resize-none disabled:opacity-50"
              />
              <div className="flex justify-end">
                <CharCounter value={metaDescription} limit={SEO_DESCRIPTION_LIMIT} />
              </div>
            </div>
          </div>
        </div>

        {/* Cover Image & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-4">
            <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
              <span>Cover Image</span>
              <span className="text-xs font-medium text-gray-400">Max 5MB</span>
            </label>
            
            {coverUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 aspect-video w-full group">
                {/* contain, not cover: a preview that crops would misrepresent
                    what the storefront actually publishes. */}
                <Image src={coverUrl} alt="Cover Preview" fill className="object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => !isSaving && fileInputRef.current?.click()}
                    disabled={isSaving}
                    className="p-3 bg-white text-gray-700 rounded-xl shadow-lg hover:scale-105 transition-transform"
                    title="Replace Image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleRemoveImage}
                    disabled={isSaving}
                    className="p-3 bg-red-500 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
                    title="Remove Image"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => !isUploading && !isSaving && fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed border-gray-300 rounded-2xl aspect-video w-full
                  flex flex-col items-center justify-center gap-3 text-gray-400 bg-gray-50
                  ${!isUploading && !isSaving && 'cursor-pointer hover:bg-gray-100 hover:border-[#914A8C]/50 hover:text-[#914A8C] transition-colors'}
                `}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-[#914A8C]" />
                    <span className="text-sm font-semibold text-gray-600">Uploading...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 mb-2">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-sm font-semibold">Click to upload cover image</span>
                  </>
                )}
              </div>
            )}
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/webp" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              disabled={isSaving || isUploading}
            />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-4">
            <label className="text-sm font-bold text-gray-700 block">Tags (Optional)</label>
            <p className="text-xs text-gray-500 mb-4">Add tags to help users find this post.</p>
            <BlogTagInput tags={tags} onChange={setTags} />
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-4">
          <label className="text-sm font-bold text-gray-700 block">Post Content <span className="text-red-500">*</span></label>
          <BlogEditor
            content={body}
            onChange={setBody}
            disabled={isSaving}
            allowImages={false}
          />
        </div>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-end z-40 md:pl-64">
        <div className="max-w-5xl w-full mx-auto flex justify-end gap-4">
          <button
            onClick={() => router.push("/admin/blogs")}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#914A8C] hover:bg-[#7a3e7e] text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-colors flex items-center gap-2 disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save as Draft"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
