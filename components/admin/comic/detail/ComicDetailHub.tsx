"use client";

import { useState } from "react";
import { ComicDetail } from "@/app/types/comic";
import { ComicSummaryCard } from "./ComicSummaryCard";
import { ComicTabBar, TabValue } from "./ComicTabBar";
import { ComicInfoEditor } from "./ComicInfoEditor";
import { ThumbnailManager } from "./ThumbnailManager";
import { VideoManager } from "./VideoManager";
import { ComicSeoEditor } from "./ComicSeoEditor";
// Placeholder imports for next phases
import { PricingEditor } from "@/components/admin/comic/pricing/PricingEditor";
import { FontList } from "@/components/admin/comic/fonts/FontList";
import { PageList } from "@/components/admin/comic/pages/PageList";
import { PrePublishChecklist } from "@/components/admin/comic/review/PrePublishChecklist";
import { ComicFactsManager } from "@/components/admin/comic/facts/ComicFactsManager";

interface ComicDetailHubProps {
  comic: ComicDetail;
}

export function ComicDetailHub({ comic }: ComicDetailHubProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  return (
    <div className="space-y-6">
      <ComicSummaryCard comic={comic} />
      
      <ComicTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <ComicInfoEditor comic={comic} />
            <ThumbnailManager comic={comic} />
            <VideoManager comic={comic} />
            <ComicSeoEditor comic={comic} />
          </div>
        )}
        
        {activeTab === "fonts" && (
          <FontList comic={comic} />
        )}
        
        {activeTab === "pages" && (
          <PageList comic={comic} />
        )}
        
        {activeTab === "pricing" && (
          <PricingEditor comic={comic} />
        )}
        
        {activeTab === "facts" && (
          <ComicFactsManager comic={comic} />
        )}

        {activeTab === "review" && (
          <PrePublishChecklist comic={comic} />
        )}
      </div>
    </div>
  );
}
