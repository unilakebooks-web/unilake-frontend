"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  List, ListOrdered, Quote, Undo, Redo, Image as ImageIcon, Link as LinkIcon 
} from 'lucide-react';
import { toast } from 'sonner';
import { requestBlogUploadUrl } from '@/app/actions/blog';
import { uploadToR2 } from '@/app/lib/r2-upload';
import { useRef, useCallback } from 'react';

interface BlogEditorProps {
  content: string;
  onChange: (content: string) => void;
  disabled?: boolean;
  /**
   * Whether the toolbar offers image insertion.
   *
   * Every current caller passes false. Legal pages (privacy, terms, refund) are
   * prose only and have no site-page upload endpoint to call; blog posts were
   * switched off deliberately — a post's imagery is its cover, and in-body
   * images were dropped rather than maintained.
   *
   * Note the ImageExtension stays registered either way, so existing content
   * containing images still renders correctly in a read-only editor.
   */
  allowImages?: boolean;
  placeholder?: string;
}

const MenuBar = ({ editor, disabled, onImageClick, allowImages }: { editor: any, disabled: boolean, onImageClick: () => void, allowImages: boolean }) => {
  if (!editor) return null;

  const toggleLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    if (previousUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const url = window.prompt('URL');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const btnClass = (isActive: boolean) => `
    p-2 rounded-lg transition-colors 
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'} 
    ${isActive ? 'bg-[#914A8C]/10 text-[#914A8C]' : 'text-gray-600'}
  `;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50/50 rounded-t-xl sticky top-0 z-10 backdrop-blur-sm">
      <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={disabled} className={btnClass(editor.isActive('bold'))} type="button" title="Bold">
        <Bold className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={disabled} className={btnClass(editor.isActive('italic'))} type="button" title="Italic">
        <Italic className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={disabled} className={btnClass(editor.isActive('strike'))} type="button" title="Strikethrough">
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={disabled} className={btnClass(editor.isActive('heading', { level: 2 }))} type="button" title="Heading 1">
        <Heading1 className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} disabled={disabled} className={btnClass(editor.isActive('heading', { level: 3 }))} type="button" title="Heading 2">
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled} className={btnClass(editor.isActive('bulletList'))} type="button" title="Bullet List">
        <List className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={disabled} className={btnClass(editor.isActive('orderedList'))} type="button" title="Numbered List">
        <ListOrdered className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={disabled} className={btnClass(editor.isActive('blockquote'))} type="button" title="Quote">
        <Quote className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={toggleLink} disabled={disabled} className={btnClass(editor.isActive('link'))} type="button" title="Link">
        <LinkIcon className="w-4 h-4" />
      </button>
      {allowImages && (
        <button onClick={onImageClick} disabled={disabled} className={btnClass(false)} type="button" title="Insert Image">
          <ImageIcon className="w-4 h-4" />
        </button>
      )}

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo() || disabled} className={btnClass(false)} type="button" title="Undo">
        <Undo className="w-4 h-4" />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo() || disabled} className={btnClass(false)} type="button" title="Redo">
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

export function BlogEditor({
  content,
  onChange,
  disabled = false,
  allowImages = true,
  placeholder = 'Write your blog post here...',
}: BlogEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4], // We reserve H1 for the blog title on the storefront
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto mx-auto my-6 border border-gray-200',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#914A8C] underline hover:text-[#7A3E76] transition-colors',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg focus:outline-none max-w-none p-6 min-h-[400px]',
      },
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for inline images
      toast.error("Image must be under 10MB");
      return;
    }

    const toastId = toast.loading("Uploading image...");

    try {
      // Get presigned URL. publicUrl is the resolved absolute R2 URL for this
      // key — it goes straight into the stored HTML, so it must be absolute.
      const { uploadUrl, publicUrl } = await requestBlogUploadUrl(
        file.name,
        file.type
      );

      // Upload directly to R2
      await uploadToR2({
        uploadUrl,
        file,
        contentType: file.type,
      });

      // Insert image at cursor
      editor.chain().focus().setImage({ src: publicUrl }).run();
      
      toast.success("Image uploaded", { id: toastId });
    } catch (error: any) {
      toast.error(error?.message || "Failed to upload image", { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`border border-gray-200 rounded-xl bg-white overflow-hidden ${disabled ? 'opacity-70' : 'focus-within:border-[#914A8C] focus-within:ring-2 focus-within:ring-[#914A8C]/20'} transition-all`}>
      {allowImages && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
        />
      )}
      <MenuBar
        editor={editor}
        disabled={disabled}
        allowImages={allowImages}
        onImageClick={() => !disabled && fileInputRef.current?.click()}
      />
      <EditorContent editor={editor} />
      
      {/* Tiptap styles needed for placeholder */}
      <style dangerouslySetInnerHTML={{__html: `
        .is-editor-empty:first-child::before {
          color: #9CA3AF;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}} />
    </div>
  );
}
