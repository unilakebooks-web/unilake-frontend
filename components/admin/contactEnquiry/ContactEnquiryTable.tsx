"use client";

import { useState } from "react";
import { ContactEnquiry, ContactEnquiryStatus } from "@/app/types/contactEnquiry";
import {
  Mail,
  Phone,
  Trash2,
  ChevronDown,
  ChevronUp,
  Inbox,
} from "lucide-react";

interface ContactEnquiryTableProps {
  enquiries: ContactEnquiry[];
  onUpdateStatus: (id: string, status: ContactEnquiryStatus) => void;
  onDelete: (enquiry: ContactEnquiry) => void;
}

export function ContactEnquiryTable({
  enquiries,
  onUpdateStatus,
  onDelete,
}: ContactEnquiryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (enquiries.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border-2 border-dashed border-[#914A8C]/25 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-full bg-[#914A8C]/10 flex items-center justify-center text-[#914A8C] mb-4 shadow-inner">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 tracking-wide mb-2">
          No Enquiries Found
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 font-medium leading-relaxed">
          There are no enquiries matching the current filter.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: ContactEnquiryStatus) => {
    switch (status) {
      case "OPEN": return "bg-red-100 text-red-700 border-red-200";
      case "VIEWED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "RESOLVED": return "bg-green-100 text-green-700 border-green-200";
      case "DISMISSED": return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-3">
      {enquiries.map((item) => {
        const isExpanded = expandedId === item.id;
        const date = new Date(item.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <div
            key={item.id}
            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-[#914A8C]/15 transition-all shadow-sm hover:shadow-md overflow-hidden"
          >
            <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">

              {/* Left Info */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#914A8C]/10 text-[#914A8C] flex items-center justify-center shrink-0 mt-1">
                  <span className="font-bold uppercase text-sm">
                    {item.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-neutral-800 text-base truncate">
                      {item.name}
                    </h3>
                    <span className="text-xs text-neutral-400 font-medium">
                      {date}
                    </span>
                  </div>

                  {/* Contact channels. These sit on the collapsed row rather
                      than behind the expand toggle: replying is the whole point
                      of an enquiry, so the admin should never have to hunt for
                      the address. stopPropagation keeps a mis-click on a link
                      from also toggling the row. */}
                  <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mb-2">
                    <a
                      href={`mailto:${item.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#914A8C] hover:underline min-w-0"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.email}</span>
                    </a>
                    <a
                      href={`tel:${item.phone.replace(/[^\d+]/g, "")}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#914A8C] hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.phone}</span>
                    </a>
                  </div>

                  {/* Truncated message unless expanded */}
                  {!isExpanded && (
                    <p className="text-sm text-neutral-600 line-clamp-1 pr-4">
                      {item.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-none border-neutral-100">

                {/* Status Dropdown */}
                <div className="relative">
                  <select
                    value={item.status}
                    onChange={(e) => onUpdateStatus(item.id, e.target.value as ContactEnquiryStatus)}
                    className={`appearance-none outline-none border cursor-pointer text-xs font-bold px-3 py-1.5 pr-8 rounded-lg shadow-sm transition-colors ${getStatusColor(item.status)}`}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="VIEWED">VIEWED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="DISMISSED">DISMISSED</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>

                <div className="w-px h-6 bg-neutral-200" />

                {/* Expand Toggle */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-2 text-neutral-400 hover:text-[#914A8C] hover:bg-[#914A8C]/10 rounded-xl transition-colors cursor-pointer"
                  title={isExpanded ? "Collapse message" : "Read full message"}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDelete(item)}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete enquiry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="p-5 pt-3 bg-neutral-50/50 border-t border-[#914A8C]/10">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  Full Message
                </h4>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {item.message}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
