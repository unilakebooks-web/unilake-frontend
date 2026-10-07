"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Webhook } from "lucide-react";
import type { WebhookEvent } from "@/app/types/order";

export function WebhookEventsLog({ events }: { events: WebhookEvent[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-[#914A8C]">
        <Webhook className="w-4 h-4" />
        <h2 className="font-bold uppercase text-xs tracking-wider">
          Webhook events {events.length > 0 && `(${events.length})`}
        </h2>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No webhooks received for this order yet.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {events.map((event) => {
            const isOpen = expanded.has(event.id);
            return (
              <li key={event.id} className="py-2.5 first:pt-0 last:pb-0">
                <button
                  onClick={() => toggle(event.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 text-left hover:bg-neutral-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200 uppercase shrink-0">
                    {event.source}
                  </span>
                  <span className="font-semibold text-sm text-neutral-900 truncate">
                    {event.eventType}
                  </span>
                  <span className="ml-auto text-xs text-neutral-500 whitespace-nowrap shrink-0">
                    {format(new Date(event.processedAt), "MMM d, h:mm a")}
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-2 ml-7 space-y-2">
                    <div className="text-xs text-neutral-500 font-mono break-all">
                      {event.eventId}
                    </div>
                    <pre className="text-[11px] bg-neutral-900 text-neutral-100 rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">
                      {JSON.stringify(event.payloadJson, null, 2)}
                    </pre>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
