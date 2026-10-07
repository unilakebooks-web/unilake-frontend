"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Globe, UploadCloud, ImageIcon, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Country } from "@/app/types/country";
import { requestFlagUploadUrl } from "@/app/actions/country";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { SearchableSelect } from "./SearchableSelect";
import { ISO_COUNTRIES } from "@/data/iso-countries";
import { ISO_CURRENCIES } from "@/data/iso-currencies";

interface CountryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialData: Country | null;
  onSave: (data: {
    code: string;
    name: string;
    currencyCode: string;
    flagKey?: string;
  }) => Promise<void>;
}

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

export function CountryModal({
  open,
  onOpenChange,
  mode,
  initialData,
  onSave,
}: CountryModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setCode(initialData.code);
        setName(initialData.name);
        setCurrencyCode(initialData.currencyCode);
        setPreviewUrl(initialData.flagUrl);
      } else {
        setCode("");
        setName("");
        setCurrencyCode("");
        setPreviewUrl(null);
      }
      setSelectedFile(null);
      setErrorMessage(null);
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }, [open, mode, initialData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setErrorMessage(
        `Unsupported format (${file.type || "unknown"}). Only PNG, JPEG, WEBP, and SVG are accepted.`
      );
      setSelectedFile(null);
      if (previewUrl && !initialData?.flagUrl.includes(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name.trim() || !currencyCode) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }
    if (mode === "create" && !selectedFile) {
      setErrorMessage("A flag image is required to create a country.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let flagKey: string | undefined = undefined;

      if (selectedFile) {
        const { uploadUrl, key } = await requestFlagUploadUrl(
          selectedFile.name,
          selectedFile.type
        );
        await uploadToR2({
          uploadUrl,
          file: selectedFile,
          contentType: selectedFile.type,
          onProgress: (percent) => setUploadProgress(percent),
        });
        flagKey = key;
      }

      await onSave({
        code,
        name: name.trim(),
        currencyCode,
        ...(flagKey && { flagKey }),
      });
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.message || "Failed to save country";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const isFormValid = code && name.trim() && currencyCode && (mode === "edit" || selectedFile);

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white border border-[#914A8C]/20 shadow-xl rounded-2xl p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-[#914A8C]">
                {mode === "create" ? "Add New Country" : "Edit Country"}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#914A8C]/70 font-medium">
                {mode === "create"
                  ? "Set up a new region for localized comic pricing."
                  : "Update country details or replace its flag."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              label="Country Code"
              placeholder="Select code..."
              options={ISO_COUNTRIES}
              value={code}
              onChange={setCode}
              disabled={isSubmitting}
            />
            <SearchableSelect
              label="Currency Code"
              placeholder="Select currency..."
              options={ISO_CURRENCIES}
              value={currencyCode}
              onChange={setCurrencyCode}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-800 block">
              Country Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. India"
              disabled={isSubmitting}
              className="h-11 px-3.5 text-sm rounded-xl border-[#914A8C]/30 focus-visible:border-[#914A8C] focus-visible:ring-[#914A8C]/30 bg-[#F8E7D2]/20 text-neutral-900"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-800 block">
              Flag Image {mode === "create" && <span className="text-red-500">*</span>}
            </label>
            {!previewUrl && !selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#914A8C]/30 hover:border-[#914A8C] rounded-2xl p-6 text-center bg-[#F8E7D2]/25 hover:bg-[#F8E7D2]/40 transition-all duration-200 cursor-pointer group flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#914A8C]/10 text-[#914A8C] group-hover:scale-110 transition-transform flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-sm font-extrabold text-neutral-800">
                  Click to upload flag
                </p>
                <p className="text-[12px] font-semibold text-[#914A8C]/80">
                  PNG, JPEG, WEBP, or SVG
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                <div className="w-20 h-14 rounded overflow-hidden bg-neutral-200 border border-neutral-300 shadow-sm shrink-0">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Flag preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-bold truncate text-neutral-800">
                    {selectedFile ? selectedFile.name : "Current Flag"}
                  </p>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#914A8C] font-semibold hover:underline mt-1"
                  >
                    Replace Image
                  </button>
                </div>
                {!isSubmitting && selectedFile && mode === "edit" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(initialData?.flagUrl || null);
                    }}
                    className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cancel replacement"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpeg,.jpg,.webp,.svg"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isSubmitting}
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-[#914A8C]">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#914A8C] transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl border-neutral-300 hover:bg-neutral-100 font-semibold h-10 px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-semibold h-10 px-6 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Create Country"
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
