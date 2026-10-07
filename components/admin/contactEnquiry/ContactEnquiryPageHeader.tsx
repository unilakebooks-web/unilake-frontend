"use client";

import { Mail } from "lucide-react";
import { ContactEnquiryStatus } from "@/app/types/contactEnquiry";

interface ContactEnquiryPageHeaderProps {
  activeFilter: ContactEnquiryStatus | undefined;
  onFilterChange: (filter: ContactEnquiryStatus | undefined) => void;
}

const TABS: { label: string; value: ContactEnquiryStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Open", value: "OPEN" },
  { label: "Viewed", value: "VIEWED" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Dismissed", value: "DISMISSED" },
];

export function ContactEnquiryPageHeader({
  activeFilter,
  onFilterChange,
}: ContactEnquiryPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#914A8C]/15 mb-6">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-[#914A8C] text-[#FFD54A] flex items-center justify-center shadow-md shadow-[#914A8C]/20 shrink-0">
          <Mail className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">
            Contact Enquiries
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#914A8C]/75">
            Messages from the contact page. Each one is waiting on a reply.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-[#F8E7D2]/50 p-1 rounded-xl shadow-inner overflow-x-auto shrink-0 border border-[#914A8C]/10 max-w-full">
        {TABS.map((tab) => {
          const isActive = activeFilter === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => onFilterChange(tab.value)}
              className={`
                px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap outline-none
                ${
                  isActive
                    ? "bg-white text-[#914A8C] shadow-sm border border-[#914A8C]/20"
                    : "text-[#914A8C]/60 hover:text-[#914A8C] hover:bg-[#914A8C]/5"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
