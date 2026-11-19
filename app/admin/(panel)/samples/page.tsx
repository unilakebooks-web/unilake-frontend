"use client";

import { useState } from "react";
import { FlaskConical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSamples } from "@/hooks/useSamples";
import { SampleCreateCard } from "@/components/admin/sample/SampleCreateCard";
import { SampleWorkspace } from "@/components/admin/sample/SampleWorkspace";
import { SAMPLE_TTL_HOURS } from "@/components/admin/sample/sampleConfig";

export default function SamplesPage() {
  const { data, isLoading, error } = useSamples();
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#914A8C]/15 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#914A8C] text-[#FFD54A] flex items-center justify-center shadow-md shadow-[#914A8C]/20 shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#914A8C] uppercase tracking-wide">
              Sample Books
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#914A8C]/75">
              Try a book with any photo. Samples are never paid for and are
              deleted after {SAMPLE_TTL_HOURS} hours.
            </p>
          </div>
        </div>
        {!openId && !creating && (
          <Button
            onClick={() => setCreating(true)}
            className="h-10 px-5 rounded-xl bg-[#914A8C] hover:bg-[#914A8C]/90 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New sample</span>
          </Button>
        )}
      </div>

      {openId ? (
        <SampleWorkspace
          key={openId}
          sessionId={openId}
          onClose={() => setOpenId(null)}
        />
      ) : creating ? (
        <SampleCreateCard
          onCreated={(id) => {
            setCreating(false);
            setOpenId(id);
          }}
          onCancel={() => setCreating(false)}
        />
      ) : isLoading ? (
        <Skeleton className="h-24 w-full rounded-2xl" />
      ) : error && !data ? (
        <p className="text-sm font-semibold text-red-600">
          The samples could not be loaded.
        </p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm font-semibold text-[#914A8C]/75">
          No samples yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#914A8C]/20 bg-white p-4"
            >
              <div>
                <p className="font-bold text-[#914A8C]">
                  {s.comic.title} for {s.childName ?? "a child"}
                </p>
                <p className="text-xs font-semibold text-[#914A8C]/70">
                  {s.pageCount} page{s.pageCount === 1 ? "" : "s"} ·{" "}
                  {s.isLive
                    ? `ends ${new Date(s.expiresAt).toLocaleString()}`
                    : "ended, files are being deleted"}
                </p>
              </div>
              {s.isLive && (
                <Button
                  variant="outline"
                  onClick={() => setOpenId(s.id)}
                  className="cursor-pointer"
                >
                  Open
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
