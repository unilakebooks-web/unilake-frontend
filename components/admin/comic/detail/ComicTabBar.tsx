import { cn } from "@/lib/utils";
import { LayoutDashboard, Type, FileImage, DollarSign, CheckCircle, Lightbulb } from "lucide-react";

export type TabValue = "overview" | "fonts" | "pages" | "pricing" | "facts" | "review";

interface ComicTabBarProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

const TABS = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "fonts", label: "Fonts", icon: Type },
  { value: "pages", label: "Pages & Bubbles", icon: FileImage },
  { value: "pricing", label: "Pricing", icon: DollarSign },
  { value: "facts", label: "Facts", icon: Lightbulb },
  { value: "review", label: "Publish Review", icon: CheckCircle },
] as const;

export function ComicTabBar({ activeTab, onTabChange }: ComicTabBarProps) {
  return (
    <div className="flex space-x-1 p-1 bg-white/60 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15 shadow-sm overflow-x-auto no-scrollbar">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
              isActive 
                ? "bg-[#914A8C] text-white shadow-sm" 
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-neutral-500")} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
