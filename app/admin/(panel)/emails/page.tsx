"use client";

import { useState } from "react";
import { RemindersPanel } from "@/components/admin/emails/RemindersPanel";
import { BroadcastPanel } from "@/components/admin/emails/BroadcastPanel";

const TABS = [
  { key: "reminders", label: "Reminders" },
  { key: "broadcast", label: "Broadcast" },
] as const;

export default function EmailsAdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("reminders");

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Emails</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Reminders to customers, and one-off broadcasts to people who chose to
          hear from you.
        </p>
      </div>

      <div className="flex gap-2 border-b border-[#914A8C]/15">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl -mb-px border-b-2 transition-colors ${
              tab === t.key
                ? "border-[#914A8C] text-[#914A8C]"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Both stay mounted and the other is hidden, so edits not yet saved survive a tab switch. */}
      <div hidden={tab !== "reminders"}>
        <RemindersPanel />
      </div>
      <div hidden={tab !== "broadcast"}>
        <BroadcastPanel />
      </div>
    </div>
  );
}
