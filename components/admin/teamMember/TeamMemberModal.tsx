"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UploadCloud, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import { requestImageUploadUrl, createTeamMember, updateTeamMember } from "@/app/actions/teamMember";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { TeamMember, CreateTeamMemberPayload, UpdateTeamMemberPayload } from "@/app/types/teamMember";
import { toast } from "sonner";

interface TeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onSuccess: () => void;
}

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export function TeamMemberModal({
  open,
  onOpenChange,
  member,
  onSuccess,
}: TeamMemberModalProps) {
  const isEditMode = !!member;

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Track if existing image was removed in edit mode
  const [imageRemoved, setImageRemoved] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "requesting" | "uploading" | "registering" | "done" | "error"
  >("idle");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (previewUrl && !previewUrl.startsWith('http')) URL.revokeObjectURL(previewUrl);
      
      setName(member?.name || "");
      setRole(member?.role || "");
      setDescription(member?.description || "");
      setLinkedinUrl(member?.linkedinUrl || "");
      setInstagramUrl(member?.instagramUrl || "");
      setTwitterUrl(member?.twitterUrl || "");
      
      setSelectedFile(null);
      setPreviewUrl(member?.imageUrl || null);
      setImageRemoved(false);
      
      setErrorMessage(null);
      setUploadState("idle");
      setProgressPercent(0);
    }
  }, [open, member]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMessage(`Unsupported format (${file.type || "unknown"}). Only PNG, JPEG, and WEBP images are accepted.`);
      setSelectedFile(null);
      if (previewUrl && !previewUrl.startsWith('http')) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(member?.imageUrl || null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setImageRemoved(false);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveImage = () => {
    if (previewUrl && !previewUrl.startsWith('http')) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageRemoved(true);
    setErrorMessage(null);
  };

  const hasChanges = () => {
    if (!isEditMode) return true;
    if (selectedFile || imageRemoved) return true;
    if (name.trim() !== member.name) return true;
    if (role.trim() !== member.role) return true;
    if (description.trim() !== (member.description || "")) return true;
    if (linkedinUrl.trim() !== (member.linkedinUrl || "")) return true;
    if (instagramUrl.trim() !== (member.instagramUrl || "")) return true;
    if (twitterUrl.trim() !== (member.twitterUrl || "")) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedRole = role.trim();

    if (!trimmedName || !trimmedRole) {
      setErrorMessage("Name and Role are required.");
      return;
    }

    if (isEditMode && !hasChanges()) {
      onOpenChange(false);
      return;
    }

    setErrorMessage(null);
    try {
      let finalImageKey: string | null | undefined = undefined;

      if (selectedFile) {
        setUploadState("requesting");
        const { uploadUrl, key } = await requestImageUploadUrl(
          selectedFile.name,
          selectedFile.type
        );

        setUploadState("uploading");
        await uploadToR2({
          uploadUrl,
          file: selectedFile,
          contentType: selectedFile.type,
          onProgress: (percent) => setProgressPercent(percent),
        });
        finalImageKey = key;
      } else if (imageRemoved) {
        finalImageKey = null; // Signal to clear it
      }

      setUploadState("registering");

      if (isEditMode) {
        // Update payload logic — null clears, omission leaves unchanged
        const payload: UpdateTeamMemberPayload = {
          name: trimmedName !== member.name ? trimmedName : undefined,
          role: trimmedRole !== member.role ? trimmedRole : undefined,
          description: description.trim() !== (member.description || "") 
            ? (description.trim() || null) : undefined,
          linkedinUrl: linkedinUrl.trim() !== (member.linkedinUrl || "") 
            ? (linkedinUrl.trim() || null) : undefined,
          instagramUrl: instagramUrl.trim() !== (member.instagramUrl || "") 
            ? (instagramUrl.trim() || null) : undefined,
          twitterUrl: twitterUrl.trim() !== (member.twitterUrl || "") 
            ? (twitterUrl.trim() || null) : undefined,
        };
        if (finalImageKey !== undefined) payload.imageKey = finalImageKey;

        // Strip undefined
        const cleanPayload = Object.fromEntries(
          Object.entries(payload).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(cleanPayload).length > 0) {
          await updateTeamMember(member.id, cleanPayload);
        }
      } else {
        // Create payload logic — omit empty string fields
        const payload: CreateTeamMemberPayload = {
          name: trimmedName,
          role: trimmedRole,
        };
        if (description.trim()) payload.description = description.trim();
        if (linkedinUrl.trim()) payload.linkedinUrl = linkedinUrl.trim();
        if (instagramUrl.trim()) payload.instagramUrl = instagramUrl.trim();
        if (twitterUrl.trim()) payload.twitterUrl = twitterUrl.trim();
        if (finalImageKey) payload.imageKey = finalImageKey;

        await createTeamMember(payload);
      }

      setUploadState("done");
      toast.success(`Team member ${isEditMode ? 'updated' : 'added'} successfully!`);
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setUploadState("error");
      const errText = err?.message || "Operation failed";
      setErrorMessage(errText);
      toast.error(`Failed to save: ${errText}`);
    }
  };

  const isBusy = ["requesting", "uploading", "registering"].includes(uploadState);
  const canSubmit = name.trim() && role.trim() && !isBusy && (isEditMode ? hasChanges() : true);

  return (
    <Dialog open={open} onOpenChange={isBusy ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white border border-[#914A8C]/20 shadow-2xl rounded-3xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#914A8C]/10 text-[#914A8C] flex items-center justify-center shrink-0 border border-[#914A8C]/15">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#914A8C]">
                {isEditMode ? "Edit Team Member" : "Add Team Member"}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#914A8C]/70 font-medium">
                {isEditMode ? "Update details for this team member." : "Add a new person to the team roster."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold text-neutral-800 block">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isBusy}
                className="h-11 px-3.5 text-sm rounded-xl border-[#914A8C]/30 focus-visible:border-[#914A8C] bg-[#F8E7D2]/20"
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-semibold text-neutral-800 block">
                Role <span className="text-red-500">*</span>
              </label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={isBusy}
                className="h-11 px-3.5 text-sm rounded-xl border-[#914A8C]/30 focus-visible:border-[#914A8C] bg-[#F8E7D2]/20"
                maxLength={255}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold text-neutral-800 block">
              Bio / Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isBusy}
              rows={2}
              className="w-full p-3.5 text-sm rounded-xl border border-[#914A8C]/30 focus-visible:outline-none focus-visible:border-[#914A8C] bg-[#F8E7D2]/20 resize-none"
              maxLength={1000}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-800 block">
              Profile Photo
            </label>
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#914A8C]/30 hover:border-[#914A8C] rounded-2xl p-6 text-center bg-[#F8E7D2]/25 hover:bg-[#F8E7D2]/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#914A8C]/10 text-[#914A8C] flex items-center justify-center mb-1">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-neutral-800">Click to browse image</p>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border bg-neutral-200">
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                </div>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy}
                    className="h-8 text-xs font-semibold rounded-lg"
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={isBusy}
                    className="h-8 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isBusy}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-neutral-800 block">
              Social Links
            </label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="LinkedIn URL"
              disabled={isBusy}
              className="h-10 px-3.5 text-sm rounded-xl border-[#914A8C]/30 focus-visible:border-[#914A8C] bg-[#F8E7D2]/20"
            />
            <Input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="Instagram URL"
              disabled={isBusy}
              className="h-10 px-3.5 text-sm rounded-xl border-[#914A8C]/30 focus-visible:border-[#914A8C] bg-[#F8E7D2]/20"
            />
            <Input
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="Twitter URL"
              disabled={isBusy}
              className="h-10 px-3.5 text-sm rounded-xl border-[#914A8C]/30 focus-visible:border-[#914A8C] bg-[#F8E7D2]/20"
            />
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {isBusy && selectedFile && (
            <div className="space-y-2 p-4 bg-[#F8E7D2]/30 rounded-2xl border border-[#914A8C]/20">
              <div className="flex items-center justify-between text-xs font-bold text-[#914A8C]">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#914A8C]" />
                  {uploadState === "requesting" && "Step 1/3: Generating signature..."}
                  {uploadState === "uploading" && `Step 2/3: Uploading photo (${progressPercent}%)...`}
                  {uploadState === "registering" && "Step 3/3: Saving member..."}
                </span>
                {uploadState === "uploading" && <span>{progressPercent}%</span>}
              </div>
              <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#914A8C] to-[#FFD54A] transition-all duration-300"
                  style={{
                    width: uploadState === "requesting" ? "15%" : uploadState === "uploading" ? `${Math.max(15, progressPercent)}%` : "95%",
                  }}
                />
              </div>
            </div>
          )}
          {isBusy && !selectedFile && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#914A8C] p-4 bg-[#F8E7D2]/30 rounded-2xl border border-[#914A8C]/20">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving member...
            </div>
          )}

          <DialogFooter className="gap-2 pt-4 border-t border-neutral-100 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
              className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-11 px-5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold h-11 px-6 shadow-md transition-transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : uploadState === "error" ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Save</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditMode ? "Save Changes" : "Add Member"}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
