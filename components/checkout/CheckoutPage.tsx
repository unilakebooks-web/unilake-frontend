"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SessionSnapshot } from "@/app/types/session";
import { getSession } from "@/app/actions/session";
import OrderSummary from "./OrderSummary";
import AddressPicker from "./AddressPicker";
import PaymentButton from "./PaymentButton";
import VerifyingPaymentOverlay from "./VerifyingPaymentOverlay";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";

interface CheckoutPageProps {
  sessionId: string;
  initialSnapshot: SessionSnapshot;
}

export default function CheckoutPage({ sessionId, initialSnapshot }: CheckoutPageProps) {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>(initialSnapshot);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const handleAddressApplied = async () => {
    // Re-read the session so `snapshot.shipping*` reflects what was just PATCHed —
    // PaymentButton gates on those fields, so a stale snapshot leaves Pay disabled.
    //
    // This MUST go through `getSession` (the axios instance), never a bare fetch():
    // a relative "/api/public/..." URL resolves against the Next server on :3000,
    // which only proxies /api/auth/*. It would 404, and the { success, data }
    // envelope would not be unwrapped even if it did not.
    try {
      const fresh = await getSession(sessionId);
      setSnapshot(fresh);
    } catch (e) {
      // Surface it. Failing silently here is what makes "Pay Now stays greyed out"
      // impossible to diagnose from the UI.
      console.error("Failed to refresh snapshot after address apply", e);
      toast.error(
        "Your address was saved, but we couldn't refresh this page. Please reload and try again."
      );
    }
  };

  const handlePaymentComplete = () => {
    setIsVerifying(true);
  };

  const handlePaymentDismissed = (status: string) => {
    setPaymentStatus(status);
    if (status !== "AWAITING_PAYMENT" && status !== "PREVIEW_READY") {
      setIsVerifying(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f2] flex flex-col">
      <HomeHeaderSection />
      
      <main className="grow py-12 px-4 w-full max-w-6xl mx-auto mt-20">
        <h1 className="text-3xl md:text-4xl font-black text-[#3F3C95] uppercase tracking-wide mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Address */}
          <div className="lg:col-span-2 space-y-8">
            <AddressPicker 
              sessionId={sessionId} 
              snapshot={snapshot} 
              onAddressApplied={handleAddressApplied} 
            />
          </div>

          {/* Right Column: Summary & Payment */}
          <div className="space-y-8">
            <OrderSummary snapshot={snapshot} />
            <PaymentButton 
              sessionId={sessionId} 
              snapshot={snapshot} 
              onPaymentComplete={handlePaymentComplete}
              onPaymentDismissed={handlePaymentDismissed}
            />
            
            {paymentStatus === "AWAITING_PAYMENT" && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium">
                Payment was not completed. You can try again when you&apos;re
                ready.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {isVerifying && <VerifyingPaymentOverlay sessionId={sessionId} />}
    </div>
  );
}
