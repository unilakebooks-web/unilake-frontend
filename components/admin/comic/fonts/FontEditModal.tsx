"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Type, Upload } from "lucide-react";
import { toast } from "sonner";
import { useUpdateFont } from "@/hooks/useFonts";
import { requestFontUploadUrl } from "@/app/actions/font";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { FontExtension, FontWithCount } from "@/app/types/comic";

const FONT_CONTENT_TYPES: Record<string, string> = {
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
};

interface FontEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  font: FontWithCount | null;
  comicId: string;
}

export function FontEditModal({ open, onOpenChange, font, comicId }: FontEditModalProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: updateFont } = useUpdateFont();

  // Reset state when font changes
  useEffect(() => {
    if (font && open) {
      setName(font.name);
      setFile(null);
    }
  }, [font, open]);

  if (!font) return null;

  const handleClose = () => {
    if (isUploading || isSaving) return;
    onOpenChange(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Font name is required");
      return;
    }

    try {
      let fontKey: string | undefined = undefined;

      if (file) {
        const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
        const ext = extMatch ? extMatch[1].toLowerCase() : "";
        
        if (!["ttf", "otf", "woff", "woff2"].includes(ext)) {
          toast.error("Invalid font file type. Allowed: .ttf, .otf, .woff, .woff2");
          return;
        }

        setIsUploading(true);
        const { uploadUrl, key } = await requestFontUploadUrl(comicId, {
          fileName: file.name,
          fileExtension: ext as FontExtension,
        });

        const contentType = FONT_CONTENT_TYPES[ext] || "application/octet-stream";
        await uploadToR2({ uploadUrl, file, contentType });
        fontKey = key;
        setIsUploading(false);
      }

      setIsSaving(true);
      
      // Only send what changed
      const updates: { name?: string; fontKey?: string } = {};
      if (name !== font.name) updates.name = name;
      if (fontKey) updates.fontKey = fontKey;

      if (Object.keys(updates).length > 0) {
        await updateFont({ fontId: font.id, comicId, data: updates });
        toast.success("Font updated successfully");
      }
      
      handleClose();
      
    } catch (err: any) {
      toast.error(err?.message || "Failed to update font");
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  const isWorking = isUploading || isSaving;
  const hasChanges = name !== font.name || file !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border border-[#914A8C]/20 shadow-xl rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#914A8C]/10 text-[#914A8C] flex items-center justify-center shrink-0">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">Edit Font</DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                Update name or replace font file.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-neutral-900">Display Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-11 bg-neutral-50 border-neutral-200"
              disabled={isWorking}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-neutral-900">Replace Font File (Optional)</Label>
            <div 
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                file ? "border-amber-300 bg-amber-50" : "border-neutral-200 hover:border-[#914A8C]/50 hover:bg-neutral-50 cursor-pointer"
              } ${isWorking ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => !isWorking && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                accept=".ttf,.otf,.woff,.woff2"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
                    <Type className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-amber-800 truncate max-w-full px-2">{file.name}</p>
                  <p className="text-xs text-amber-600 mt-1">{(file.size / 1024).toFixed(1)} KB (New file)</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-5 h-5 text-neutral-400 mb-2" />
                  <p className="text-sm font-medium text-neutral-900">Click to select new font file</p>
                  <p className="text-xs text-neutral-500 mt-1">Leave empty to keep existing file.</p>
                </div>
              )}
            </div>
            {font._count.bubbles > 0 && file && (
              <p className="text-[10px] font-bold text-amber-600 mt-1">
                Warning: Changing the file will affect {font._count.bubbles} existing bubble(s).
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isWorking}
              className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isWorking || !hasChanges || !name.trim()}
              className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold h-11 px-8 shadow-sm"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
              ) : isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
