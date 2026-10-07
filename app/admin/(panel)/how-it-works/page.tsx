"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useHowItWorks, useSaveHowItWorks } from "@/hooks/useHowItWorks";
import { requestHowItWorksUploadUrl } from "@/app/actions/howItWorks";
import { uploadToR2 } from "@/app/lib/r2-upload";
import { HowItWorksStep } from "@/app/types/howItWorks";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Film, Image as ImageIcon, Trash2, Plus, GripVertical, Loader2 } from "lucide-react";
import Image from "next/image";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

export default function HowItWorksAdminPage() {
  const { data: howItWorks, isLoading, isError } = useHowItWorks();
  const { mutateAsync: saveSection, isPending: isSaving } = useSaveHowItWorks();

  // Form State
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<HowItWorksStep[]>([]);
  
  // Media State
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoKey, setVideoKey] = useState<string | null | undefined>(undefined);
  
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [posterKey, setPosterKey] = useState<string | null | undefined>(undefined);

  // Upload State
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [isPosterUploading, setIsPosterUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Refs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (howItWorks !== undefined) {
      setIsActive(howItWorks?.isActive ?? false);
      setSteps(howItWorks?.steps ?? []);
      setVideoUrl(howItWorks?.videoUrl ?? null);
      setPosterUrl(howItWorks?.posterUrl ?? null);
      // Reset keys since we just loaded from server
      setVideoKey(undefined);
      setPosterKey(undefined);
    }
  }, [howItWorks]);

  // Derived State
  const isReady = !!videoUrl && steps.length > 0;

  // Upload Handlers
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Video must be under 50 MB. Please compress it and try again.");
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    try {
      setIsVideoUploading(true);
      setVideoProgress(0);

      const { uploadUrl, key } = await requestHowItWorksUploadUrl(
        "video",
        file.name,
        file.type
      );

      await uploadToR2({
        uploadUrl,
        file,
        contentType: file.type,
        onProgress: setVideoProgress,
      });

      // Show local preview
      setVideoUrl(URL.createObjectURL(file));
      setVideoKey(key);
      toast.success("Video uploaded successfully (pending save)");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload video");
    } finally {
      setIsVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsPosterUploading(true);

      const { uploadUrl, key } = await requestHowItWorksUploadUrl(
        "poster",
        file.name,
        file.type
      );

      await uploadToR2({
        uploadUrl,
        file,
        contentType: file.type,
      });

      // Show local preview
      setPosterUrl(URL.createObjectURL(file));
      setPosterKey(key);
      toast.success("Poster uploaded successfully (pending save)");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload poster");
    } finally {
      setIsPosterUploading(false);
      if (posterInputRef.current) posterInputRef.current.value = "";
    }
  };

  const handleRemoveVideo = () => {
    setVideoUrl(null);
    setVideoKey(null);
  };

  const handleRemovePoster = () => {
    setPosterUrl(null);
    setPosterKey(null);
  };

  // Steps Handlers
  const addStep = () => {
    setSteps([...steps, { heading: "", description: "" }]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof HowItWorksStep, value: string) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
  };

  // Save Handler
  const handleSave = async () => {
    // Validate steps
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].heading.trim() || !steps[i].description.trim()) {
        toast.error(`Step ${i + 1} is missing a heading or description.`);
        return;
      }
      if (steps[i].heading.length > 120) {
        toast.error(`Step ${i + 1} heading must be 120 characters or less.`);
        return;
      }
      if (steps[i].description.length > 500) {
        toast.error(`Step ${i + 1} description must be 500 characters or less.`);
        return;
      }
    }

    try {
      const payload: Record<string, unknown> = {
        steps,
        isActive,
      };

      if (videoKey !== undefined) payload.videoKey = videoKey;
      if (posterKey !== undefined) payload.posterKey = posterKey;

      await saveSection(payload);
      toast.success("How It Works section saved successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save section");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex flex-col items-center justify-center">
          <AlertCircle className="w-10 h-10 mb-4" />
          <h2 className="text-lg font-bold mb-2">Failed to load configuration</h2>
          <p>Please refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-[#914A8C]/15">
        <div>
          <h1 className="text-2xl font-black text-[#914A8C] mb-1">How It Works</h1>
          <p className="text-gray-500 font-medium text-sm">Configure the homepage explainer section.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Visibility:</span>
          <Switch 
            checked={isActive}
            onCheckedChange={setIsActive}
            className="data-[state=checked]:bg-[#914A8C]"
          />
          <span className={`text-sm font-bold ${isActive ? 'text-[#914A8C]' : 'text-gray-500'}`}>
            {isActive ? "Active" : "Hidden"}
          </span>
        </div>
      </div>

      {/* Readiness Warning */}
      {isActive && !isReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm">Not Visible Publicly</h3>
            <p className="text-sm">
              Even though this section is set to Active, it will not appear on the storefront until you upload a video and add at least one step.
            </p>
          </div>
        </div>
      )}

      {/* Media Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-6">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Film className="w-5 h-5 text-[#914A8C]" />
          Media
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Video Column */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">Explainer Video</label>
            <p className="text-xs text-gray-500 mb-2">Max 50MB. MP4 or WebM.</p>
            
            {videoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black aspect-[9/16] max-h-[400px] w-full flex items-center justify-center">
                <video src={videoUrl} controls preload="none" className="max-h-full w-auto" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow backdrop-blur transition-colors"
                    title="Replace Video"
                  >
                    <Film className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRemoveVideo}
                    className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg shadow backdrop-blur transition-colors"
                    title="Remove Video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => !isVideoUploading && videoInputRef.current?.click()}
                className={`
                  border-2 border-dashed border-gray-300 rounded-2xl aspect-[9/16] max-h-[400px] w-full
                  flex flex-col items-center justify-center gap-3 text-gray-400 bg-gray-50
                  ${!isVideoUploading && 'cursor-pointer hover:bg-gray-100 hover:border-[#914A8C]/50 hover:text-[#914A8C] transition-colors'}
                `}
              >
                {isVideoUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-[#914A8C]" />
                    <span className="text-sm font-semibold text-gray-600">Uploading {videoProgress}%...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-8 h-8" />
                    <span className="text-sm font-semibold">Click to upload video</span>
                  </>
                )}
              </div>
            )}
            <input 
              type="file" 
              accept="video/mp4,video/webm,video/quicktime" 
              className="hidden" 
              ref={videoInputRef}
              onChange={handleVideoUpload}
            />
          </div>

          {/* Poster Column */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">Video Poster (Thumbnail)</label>
            <p className="text-xs text-gray-500 mb-2">Shown before the video plays.</p>
            
            {posterUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 aspect-[9/16] max-h-[400px] w-full">
                <Image src={posterUrl} alt="Poster" fill className="object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => posterInputRef.current?.click()}
                    className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow backdrop-blur transition-colors"
                    title="Replace Poster"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRemovePoster}
                    className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-lg shadow backdrop-blur transition-colors"
                    title="Remove Poster"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => !isPosterUploading && posterInputRef.current?.click()}
                className={`
                  border-2 border-dashed border-gray-300 rounded-2xl aspect-[9/16] max-h-[400px] w-full
                  flex flex-col items-center justify-center gap-3 text-gray-400 bg-gray-50
                  ${!isPosterUploading && 'cursor-pointer hover:bg-gray-100 hover:border-[#914A8C]/50 hover:text-[#914A8C] transition-colors'}
                `}
              >
                {isPosterUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-[#914A8C]" />
                    <span className="text-sm font-semibold text-gray-600">Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-semibold">Click to upload poster</span>
                  </>
                )}
              </div>
            )}
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/webp" 
              className="hidden" 
              ref={posterInputRef}
              onChange={handlePosterUpload}
            />
          </div>
        </div>
      </div>

      {/* Steps Editor */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Process Steps</h2>
          <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
            {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
          </span>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50 relative group">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#914A8C] text-white font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </div>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                  <input
                    type="text"
                    value={step.heading}
                    onChange={(e) => updateStep(index, "heading", e.target.value)}
                    placeholder="Step Heading (e.g., Introduce Your Child)"
                    maxLength={120}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 font-bold text-gray-800 outline-none focus:border-[#914A8C] focus:ring-1 focus:ring-[#914A8C] transition-all"
                  />
                </div>
                <div>
                  <textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, "description", e.target.value)}
                    placeholder="Step description..."
                    maxLength={500}
                    rows={3}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 outline-none focus:border-[#914A8C] focus:ring-1 focus:ring-[#914A8C] transition-all resize-none"
                  />
                </div>
              </div>

              <button
                onClick={() => removeStep(index)}
                className="absolute -right-2 -top-2 w-8 h-8 bg-white border border-gray-200 text-red-500 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
                title="Remove Step"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {steps.length === 0 && (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No steps added yet.
            </div>
          )}
        </div>

        <button
          onClick={addStep}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-bold flex items-center justify-center gap-2 hover:border-[#914A8C] hover:text-[#914A8C] hover:bg-[#914A8C]/5 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Step
        </button>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-end z-40 md:pl-64">
        <div className="max-w-5xl w-full mx-auto flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#914A8C] hover:bg-[#7a3e7e] text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
