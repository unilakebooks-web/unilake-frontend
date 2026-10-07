"use client";

import { useEffect, useState } from "react";
import { PublicComicDetail } from "@/app/types/comic";
import ComicThumbnailCarousel from "./ComicThumbnailCarousel";
import ComicInfoCards from "./ComicInfoCards";
import PhotoGuidelines from "./PhotoGuidelines";
import ComicPersonalizeForm from "./ComicPersonalizeForm";
import { clearSession, getSession as getStoredSession, setShowPreloader } from "@/app/lib/session-storage";
import { getSession as fetchSession } from "@/app/actions/session";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { OrdersPausedBanner } from "@/components/shared/OrdersPausedBanner";

interface ComicDetailContentProps {
  comic: PublicComicDetail;
}

export default function ComicDetailContent({ comic }: ComicDetailContentProps) {
  const router = useRouter();
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null);

  // A stored session is only a hint. Before offering "Continue" we confirm with the
  // server that it still exists, hasn't expired, and actually has a photo — otherwise
  // the button is a dead end that lands the user on an error screen.
  useEffect(() => {
    const stored = getStoredSession(comic.id);
    if (!stored) return;

    let cancelled = false;

    fetchSession(stored.sessionId)
      .then((session) => {
        if (cancelled) return;

        // Anything before PHOTO_UPLOADED has no photo, so the preview page could never
        // generate. Expired sessions load fine over REST but their WebSocket is refused.
        const isResumable =
          !session.isExpired &&
          session.status !== "CREATED";

        if (isResumable) {
          setResumeSessionId(stored.sessionId);
        } else {
          clearSession(comic.id);
        }
      })
      .catch(() => {
        // Gone, or unreachable. Either way, don't offer it — just fall back to the
        // normal form. The user never learns anything was wrong.
        if (!cancelled) clearSession(comic.id);
      });

    return () => {
      cancelled = true;
    };
  }, [comic.id]);

  return (
    <div className="bg-[#F8E7D2] min-h-screen py-10 lg:py-16 flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
        <>
          {/* Renders nothing while the store is open. Sits above the resume
              banner so it is the first thing read when orders are paused. */}
          <OrdersPausedBanner className="mb-8" />

          {/* Resume Banner */}
            {resumeSessionId && (
              <div className="mb-8 w-full bg-[#3F3C95] text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#2B2882]">
                <div>
                  <h3 className="font-bold text-xl mb-1">Resume Personalization</h3>
                  <p className="text-[#EBE7FF] text-sm">
                    You were working on a personalized comic. Pick up right where you left off!
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/personalize/${resumeSessionId}/preview`)}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-[#FFD54A] text-[#3F3C95] font-bold rounded-full hover:brightness-105 transition-all shadow-md w-full sm:w-auto"
                >
                  <Play size={18} className="fill-[#3F3C95]" />
                  Continue
                </button>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
              {/* Left Column: Carousel + Info Cards */}
              <div className="w-full lg:w-[45%] flex flex-col items-center lg:items-start lg:sticky lg:top-24">
                <ComicThumbnailCarousel
                  images={comic.coverThumbnailUrls}
                  videoUrl={comic.previewVideoUrl}
                />
                <ComicInfoCards />
                <PhotoGuidelines />
              </div>

              {/* Right Column: Form */}
              <div className="w-full lg:w-[55%] flex justify-center lg:justify-start">
                <ComicPersonalizeForm 
                  comic={comic} 
                  onSuccess={(_name, url) => {
                    const sessionId = url.split("/")[2];
                    if (sessionId) setShowPreloader(sessionId);
                    router.push(url);
                  }}
                />
              </div>
            </div>
          </>
      </div>
    </div>
  );
}
