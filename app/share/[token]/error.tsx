"use client";

import { Button } from "@/components/ui/button";

// The backend could not be reached or failed: this is not "gone", so the visitor may try again. No technical text.
// unstable_retry re-fetches on the server (reset only redraws the same failed result).
export default function SharedBookError({ unstable_retry }: { error: Error; unstable_retry: () => void }) {
  return (
    <main className="min-h-screen bg-[#FFF8EE] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8 text-center">
        <h1 className="text-xl font-bold text-neutral-900">Something went wrong</h1>
        <p className="text-sm text-neutral-600 mt-3">
          We could not load this book right now. Please try again.
        </p>
        <Button
          onClick={() => unstable_retry()}
          className="mt-6 h-11 rounded-xl bg-[#914A8C] hover:bg-[#7d3f79] text-white font-semibold px-6"
        >
          Try again
        </Button>
      </div>
    </main>
  );
}
