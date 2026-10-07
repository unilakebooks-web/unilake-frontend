"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "@/app/lib/axios";
import { SessionSnapshot } from "@/app/types/session";
import { useRouter } from "next/navigation";
import { chauPhilomeneOne } from "@/app/fonts";
import { Button } from "@/components/ui/button";

interface VerifyingPaymentOverlayProps {
  sessionId: string;
}

/** Gap between polls. Fast enough not to feel broken right after paying. */
const POLL_INTERVAL_MS = 2_000;
/** ~20s — soften the copy, the webhook is taking longer than usual. */
const SLOW_AFTER_POLLS = 10;
/** ~90s — stop polling and hand the user an explicit next step. */
const MAX_POLLS = 45;

export default function VerifyingPaymentOverlay({ sessionId }: VerifyingPaymentOverlayProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "slow" | "timeout" | "failed">("verifying");
  // Bumped by "Check again" to restart the loop. It is the ONLY piece of state in
  // this effect's deps — see the note below.
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    // The poll counter lives here, not in state, on purpose. Putting it in state and
    // listing it as a dep re-ran this effect on every tick, and the effect body fires
    // a request immediately — so each response triggered another request with no delay
    // and the whole retry budget burned in a few seconds instead of 90.
    //
    // Everything mutable is scoped to this closure and torn down by the cleanup, so at
    // most one request and one timer are ever in flight.
    let isActive = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let polls = 0;

    const poll = async () => {
      if (!isActive) return;

      try {
        const { data: snapshot } = await api.get<SessionSnapshot>(
          `/api/public/sessions/${sessionId}`
        );
        if (!isActive) return;

        const s = snapshot.status;

        // Every paid page failed to generate. The money WAS taken — never phrase
        // this to the user as a failed payment.
        if (s === "FAILED") {
          setStatus("failed");
          return;
        }

        // Anything other than these two means the webhook has landed and the
        // session has moved on: GENERATING_PAID, PAID_PAGES_READY, CONFIRMED…
        if (s !== "AWAITING_PAYMENT" && s !== "PAID") {
          router.replace(`/personalize/${sessionId}/preview`);
          return;
        }

        // Still pending — fall through to the retry budget below.
      } catch {
        if (!isActive) return;
        // A network blip spends a poll and keeps trying. The webhook is the only
        // thing that can move this session, so there is nothing else to do.
      }

      polls += 1;

      if (polls >= MAX_POLLS) {
        setStatus("timeout");
        return;
      }
      if (polls >= SLOW_AFTER_POLLS) {
        setStatus("slow");
      }

      timerId = setTimeout(poll, POLL_INTERVAL_MS);
    };

    // First check runs immediately — the webhook has often already landed by the
    // time the Razorpay modal finishes closing.
    void poll();

    return () => {
      isActive = false;
      if (timerId) clearTimeout(timerId);
    };
    // `status` is deliberately NOT a dep: this effect writes it, and reading it back
    // here is what created the feedback loop. `restartKey` is the one intentional
    // re-entry point.
  }, [sessionId, router, restartKey]);

  const handleRestartPoll = () => {
    setStatus("verifying");
    setRestartKey((k) => k + 1);
  };

  return (
    <div className="fixed inset-0 bg-[#fcf9f2]/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
      {status === "failed" ? (
        <div className="max-w-md flex flex-col items-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className={`${chauPhilomeneOne.className} text-3xl text-[#3F3C95] mb-4`}>
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-8">
            There was an issue processing your order. If your account was charged, please contact support and we'll fix it right away.
          </p>
          <Button onClick={() => window.location.href = "mailto:support@unilake.com"} className="bg-[#3F3C95] text-white hover:bg-[#3F3C95]/90 rounded-full px-8 h-12">
            Contact Support
          </Button>
        </div>
      ) : status === "timeout" ? (
        <div className="max-w-md flex flex-col items-center">
          <Loader2 className="w-16 h-16 text-[#FFD54A] animate-spin mb-6" />
          <h2 className={`${chauPhilomeneOne.className} text-3xl text-[#3F3C95] mb-4`}>
            Still confirming...
          </h2>
          <p className="text-gray-600 mb-8">
            We're still waiting for the payment provider to confirm your order. You'll receive an email as soon as your personalized comic starts generating.
          </p>
          <div className="flex gap-4">
            <Button onClick={handleRestartPoll} variant="outline" className="rounded-full border-2 border-[#3F3C95] text-[#3F3C95] h-12 px-6">
              Check Again
            </Button>
            <Button onClick={() => router.push("/")} className="bg-[#3F3C95] text-white hover:bg-[#3F3C95]/90 rounded-full h-12 px-6">
              Return Home
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-md flex flex-col items-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#FFD54A] rounded-full blur-xl opacity-50 animate-pulse"></div>
            <Loader2 className="w-20 h-20 text-[#3F3C95] animate-spin relative z-10" />
          </div>
          
          <h2 className={`${chauPhilomeneOne.className} text-3xl md:text-4xl text-[#3F3C95] mb-4 tracking-wide uppercase`}>
            Verifying your payment
          </h2>
          
          <p className="text-gray-600 text-lg font-medium">
            {status === "slow" 
              ? "Still working — payment confirmations occasionally take a little longer." 
              : "Please don't close this window. This usually takes a few seconds."}
          </p>
        </div>
      )}
    </div>
  );
}
