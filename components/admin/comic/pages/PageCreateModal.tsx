"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileImage, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useCreatePage } from "@/hooks/usePages";
import { requestPageUploadUrl } from "@/app/actions/page";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { ComicDetail, FaceDirection } from "@/app/types/comic";
import { PAGE_CONTENT_TYPES, PAGE_FILE_ERROR, getPageExtension } from "./pageFileTypes";

interface PageCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comic: ComicDetail;
  nextPageNumber: number;
}

export function PageCreateModal({ open, onOpenChange, comic, nextPageNumber }: PageCreateModalProps) {
  const [isPreviewPage, setIsPreviewPage] = useState(false);
  const [hasFace, setHasFace] = useState(true);
  const [pagePrompt, setPagePrompt] = useState("");
  const [steps, setSteps] = useState(3);
  const [cfg, setCfg] = useState(1.0);
  const [mirrorFace, setMirrorFace] = useState(false);
  const [faceDirection, setFaceDirection] = useState<string>("none");

  // Page numbers are assigned automatically and reordered from the Pages tab,
  // so nextPageNumber is read straight from props — holding it in state would
  // go stale between saves and produce a 409 on the next open.
  const previewCount = comic.pages.filter((p) => p.isPreviewPage).length;
  const previewLimitReached = previewCount >= comic.freePreviewPages;
  
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const artworkInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);
  
  const { mutateAsync: createPage } = useCreatePage();

  // Pages are preview pages by default until the comic's quota is used up.
  useEffect(() => {
    if (open) setIsPreviewPage(!previewLimitReached);
  }, [open, previewLimitReached]);

  const handleClose = () => {
    if (isUploading || isSaving) return;
    setIsPreviewPage(false);
    setHasFace(true);
    setPagePrompt("");
    setSteps(3);
    setCfg(1.0);
    setMirrorFace(false);
    setFaceDirection("none");
    setArtworkFile(null);
    setMaskFile(null);
    if (artworkInputRef.current) artworkInputRef.current.value = "";
    if (maskInputRef.current) maskInputRef.current.value = "";
    onOpenChange(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artworkFile) {
      toast.error("Artwork file is required");
      return;
    }
    if (hasFace && !maskFile) {
      toast.error("Face mask file is required since 'Has Face' is enabled");
      return;
    }
    if (hasFace && !pagePrompt.trim()) {
      toast.error("Page prompt is required");
      return;
    }
    if (hasFace && (steps < 1 || steps > 8 || !Number.isInteger(steps))) {
      toast.error("Steps must be an integer between 1 and 8");
      return;
    }
    if (hasFace && (cfg < 1.0 || cfg > 3.0)) {
      toast.error("CFG must be between 1.0 and 3.0");
      return;
    }

    try {
      setIsUploading(true);
      
      let artworkKey: string | undefined;
      let maskKey: string | undefined;

      // 1. Upload Artwork
      const artExt = getPageExtension(artworkFile);
      if (!artExt) throw new Error(PAGE_FILE_ERROR);

      const { uploadUrl: artUrl, key: aKey } = await requestPageUploadUrl(comic.id, {
        fileExtension: artExt,
        fileType: "artwork"
      });
      await uploadToR2({
        uploadUrl: artUrl,
        file: artworkFile,
        contentType: PAGE_CONTENT_TYPES[artExt],
      });
      artworkKey = aKey;

      // 2. Upload Mask if needed
      if (hasFace && maskFile) {
        const maskExt = getPageExtension(maskFile);
        if (!maskExt) throw new Error(PAGE_FILE_ERROR);

        const { uploadUrl: maskUrl, key: mKey } = await requestPageUploadUrl(comic.id, {
          fileExtension: maskExt,
          fileType: "masks"
        });
        await uploadToR2({
          uploadUrl: maskUrl,
          file: maskFile,
          contentType: PAGE_CONTENT_TYPES[maskExt],
        });
        maskKey = mKey;
      }

      setIsUploading(false);
      setIsSaving(true);

      // 3. Create Page
      await createPage({
        comicId: comic.id,
        data: {
          pageNumber: nextPageNumber,
          isPreviewPage,
          hasFace,
          pagePrompt: hasFace ? pagePrompt.trim() : undefined,
          steps: hasFace ? steps : 3,
          cfg: hasFace ? cfg : 1.0,
          mirrorFace: hasFace ? mirrorFace : false,
          faceDirection: hasFace && faceDirection !== "none" ? faceDirection : undefined,
          artworkUrl: artworkKey,
          maskUrl: maskKey
        }
      });
      
      toast.success("Page created successfully");
      handleClose();
      
    } catch (err: any) {
      toast.error(err?.message || "Failed to create page");
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  const isWorking = isUploading || isSaving;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl bg-white border border-[#914A8C]/20 shadow-xl rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#914A8C]/10 text-[#914A8C] flex items-center justify-center shrink-0">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">Add Page</DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 font-medium">
                Upload artwork and configure page settings.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Settings */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-neutral-900">Page Number</Label>
                  <Input
                    type="number"
                    value={nextPageNumber}
                    disabled
                    readOnly
                    className="rounded-xl h-10 bg-neutral-100 border-neutral-200 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-neutral-500 leading-tight">
                    Assigned automatically. Drag pages on the Pages tab to reorder.
                  </p>
                </div>
              </div>

              {hasFace && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-neutral-900">Page Prompt *</Label>
                  <Textarea
                    value={pagePrompt}
                    onChange={(e) => setPagePrompt(e.target.value)}
                    placeholder="Describe the scene for AI generation..."
                    rows={2}
                    className="rounded-xl bg-neutral-50 border-neutral-200 resize-none text-sm"
                    disabled={isWorking}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-row items-center justify-between rounded-xl border border-neutral-200 p-2.5 bg-white">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-neutral-900">Preview Page</Label>
                    <p className="text-[10px] text-neutral-500">
                      Free to read · {previewCount}/{comic.freePreviewPages} used
                    </p>
                  </div>
                  <Switch
                    checked={isPreviewPage}
                    onCheckedChange={(checked) => {
                      if (checked && previewLimitReached) {
                        toast.error(
                          `All ${comic.freePreviewPages} free preview pages are already assigned. Turn one off on another page first.`
                        );
                        return;
                      }
                      setIsPreviewPage(checked);
                    }}
                    disabled={isWorking}
                  />
                </div>

                <div className="flex flex-row items-center justify-between rounded-xl border border-neutral-200 p-2.5 bg-white">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-neutral-900">Has Face</Label>
                    <p className="text-[10px] text-neutral-500">Requires mask</p>
                  </div>
                  <Switch 
                    checked={hasFace} 
                    onCheckedChange={(checked) => {
                      setHasFace(checked);
                      if (!checked) {
                        setMirrorFace(false);
                        setFaceDirection("none");
                      }
                    }} 
                    disabled={isWorking} 
                  />
                </div>
              </div>

              {hasFace && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-row items-center justify-between rounded-xl border border-neutral-200 p-2.5 bg-white">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-neutral-900">Mirror Face</Label>
                      <p className="text-[10px] text-neutral-500">Flip the face horizontally</p>
                    </div>
                    <Switch checked={mirrorFace} onCheckedChange={setMirrorFace} disabled={isWorking} />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label className="text-sm font-semibold text-neutral-900">Face Direction</Label>
                    <Select value={faceDirection} onValueChange={(val) => setFaceDirection(val || "none")} disabled={isWorking}>
                      <SelectTrigger className="w-full rounded-xl h-10 bg-white border-neutral-200">
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value={FaceDirection.FRONT}>Front</SelectItem>
                        <SelectItem value={FaceDirection.THREE_QUARTER}>Three-Quarter</SelectItem>
                        <SelectItem value={FaceDirection.SIDE}>Side</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {hasFace && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-neutral-900">Steps *</Label>
                    <Input
                      type="number" min={1} max={8} step={1}
                      value={steps} onChange={(e) => setSteps(Number(e.target.value))}
                      disabled={isWorking}
                      className="rounded-xl h-10 bg-white border-neutral-200"
                    />
                    <p className="text-[10px] text-neutral-500 leading-tight">AI generation steps (1–8)</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-neutral-900">CFG *</Label>
                    <Input
                      type="number" min={1.0} max={3.0} step={0.1}
                      value={cfg} onChange={(e) => setCfg(Number(e.target.value))}
                      disabled={isWorking}
                      className="rounded-xl h-10 bg-white border-neutral-200"
                    />
                    <p className="text-[10px] text-neutral-500 leading-tight">Classifier-free guidance (1.0–3.0)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Uploads */}
            <div className="space-y-4">
              {/* Artwork Upload */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-neutral-900">Artwork *</Label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors h-36 flex flex-col justify-center ${
                    artworkFile ? "border-green-300 bg-green-50" : "border-neutral-200 hover:border-[#914A8C]/50 hover:bg-neutral-50 cursor-pointer"
                  } ${isWorking ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => !isWorking && artworkInputRef.current?.click()}
                >
                  <input 
                    type="file" className="hidden" ref={artworkInputRef} accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!getPageExtension(file)) {
                        toast.error(PAGE_FILE_ERROR);
                        e.target.value = "";
                        return;
                      }
                      setArtworkFile(file);
                    }}
                  />
                  {artworkFile ? (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-5 h-5 text-green-600 mb-1" />
                      <p className="text-xs font-bold text-green-800 truncate w-full px-1">{artworkFile.name}</p>
                      <p className="text-[10px] text-green-600">{(artworkFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-5 h-5 text-neutral-400 mb-2" />
                      <p className="text-xs font-medium text-neutral-900">Artwork Image</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mask Upload */}
              <div className="space-y-1.5">
                <Label className={`text-sm font-semibold ${hasFace ? "text-neutral-900" : "text-neutral-400"}`}>
                  Face Mask {hasFace && "*"}
                </Label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors h-36 flex flex-col justify-center ${
                    !hasFace ? "bg-neutral-100 border-neutral-200 opacity-50 cursor-not-allowed" :
                    maskFile ? "border-amber-300 bg-amber-50 cursor-pointer" : "border-neutral-200 hover:border-[#914A8C]/50 hover:bg-neutral-50 cursor-pointer"
                  } ${isWorking ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => !isWorking && hasFace && maskInputRef.current?.click()}
                >
                  <input 
                    type="file" className="hidden" ref={maskInputRef} accept=".jpg,.jpeg,.png,.webp" disabled={!hasFace}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!getPageExtension(file)) {
                        toast.error(PAGE_FILE_ERROR);
                        e.target.value = "";
                        return;
                      }
                      setMaskFile(file);
                    }}
                  />
                  {!hasFace ? (
                     <p className="text-xs font-medium text-neutral-500">Not required</p>
                  ) : maskFile ? (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-5 h-5 text-amber-600 mb-1" />
                      <p className="text-xs font-bold text-amber-800 truncate w-full px-1">{maskFile.name}</p>
                      <p className="text-[10px] text-amber-600">{(maskFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-5 h-5 text-neutral-400 mb-2" />
                      <p className="text-xs font-medium text-neutral-900">Mask Image</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 mt-2 border-t border-neutral-100">
            <Button
              type="button" variant="outline" onClick={handleClose} disabled={isWorking}
              className="rounded-xl border-neutral-300 font-semibold h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit" disabled={isWorking || !artworkFile || (hasFace && !maskFile) || (hasFace && !pagePrompt.trim())}
              className="rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold h-10 px-8 shadow-sm"
            >
              {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
               : isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
               : "Create Page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
