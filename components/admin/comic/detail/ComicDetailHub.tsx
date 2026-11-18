"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ComicDetail } from "@/app/types/comic";
import { ComicSummaryCard } from "./ComicSummaryCard";
import { ComicTabBar, TAB_VALUES, TabValue } from "./ComicTabBar";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  // The open tab lives in the URL (?tab=pages), so coming back from the bubble
  // editor, a refresh or the browser's Back button lands on the same tab.
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabValue>(
    tabParam && TAB_VALUES.includes(tabParam) ? (tabParam as TabValue) : "overview"
  );

  const changeTab = (tab: TabValue) => {
    setActiveTab(tab);
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <ComicSummaryCard comic={comic} />
      
      <ComicTabBar activeTab={activeTab} onTabChange={changeTab} />
      
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
