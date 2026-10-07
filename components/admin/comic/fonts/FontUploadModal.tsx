"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Type, Upload } from "lucide-react";
import { toast } from "sonner";
import { useCreateFont } from "@/hooks/useFonts";
import { requestFontUploadUrl } from "@/app/actions/font";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { FontExtension } from "@/app/types/comic";

const FONT_CONTENT_TYPES: Record<string, string> = {
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
};

interface FontUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comicId: string;
}

export function FontUploadModal({ open, onOpenChange, comicId }: FontUploadModalProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: createFont } = useCreateFont();

  const handleClose = () => {
    if (isUploading || isSaving) return;
    setName("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Font name is required");
      return;
    }
    if (!file) {
      toast.error("Please select a font file");
      return;
    }

    const extMatch = file.name.match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "";
    
    if (!["ttf", "otf", "woff", "woff2"].includes(ext)) {
      toast.error("Invalid font file type. Allowed: .ttf, .otf, .woff, .woff2");
      return;
    }

    try {
      // 1. Get upload URL (Sequential upload only per integration doc 9.8)
      setIsUploading(true);
      const { uploadUrl, key } = await requestFontUploadUrl(comicId, {
        fileName: file.name,
        fileExtension: ext as FontExtension,
      });

      // 2. Upload to R2
      const contentType = FONT_CONTENT_TYPES[ext] || "application/octet-stream";
      await uploadToR2({ uploadUrl, file, contentType });
      setIsUploading(false);

      // 3. Create font record
      setIsSaving(true);
      await createFont({ comicId, data: { name, fontKey: key } });
      
      toast.success("Font uploaded successfully");
      handleClose();
      
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload font");
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  const isWorking = isUploading || isSaving;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border border-[#914A8C]/20 shadow-xl rounded-3xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#914A8C]/10 text-[#914A8C] flex items-center justify-center shrink-0">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">Upload Font</DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                Add a new font for speech bubbles.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-neutral-900">Display Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Comic Sans Bold"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-11 bg-neutral-50 border-neutral-200"
              disabled={isWorking}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-neutral-900">Font File *</Label>
            <div 
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                file ? "border-green-300 bg-green-50" : "border-neutral-200 hover:border-[#914A8C]/50 hover:bg-neutral-50 cursor-pointer"
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
                    // Auto-fill name if empty
                    if (!name) {
                      const fileName = e.target.files[0].name.replace(/\.[^/.]+$/, "");
                      setName(fileName);
                    }
                  }
                }}
              />
              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-2">
                    <Type className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold text-green-800 truncate max-w-full px-2">{file.name}</p>
                  <p className="text-xs text-green-600 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-5 h-5 text-neutral-400 mb-2" />
                  <p className="text-sm font-medium text-neutral-900">Click to select font file</p>
                  <p className="text-xs text-neutral-500 mt-1">Allowed: .ttf, .otf, .woff, .woff2</p>
                </div>
              )}
            </div>
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
              disabled={isWorking || !file || !name.trim()}
              className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold h-11 px-8 shadow-sm"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
              ) : isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                "Upload Font"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
