"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { SessionSnapshot } from "@/app/types/session";
import { attachUser, getSession } from "@/app/actions/session";
import { useAuth } from "@/app/hooks/useAuth";
import OrderSummary from "./OrderSummary";
import AddressPicker from "./AddressPicker";
import PaymentButton from "./PaymentButton";
import VerifyingPaymentOverlay from "./VerifyingPaymentOverlay";
import LoginModal from "./LoginModal";

const OTHER_ACCOUNT_MESSAGE =
  "This book is linked to a different account. Please log in with the account you used before.";
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
  const [loginDismissed, setLoginDismissed] = useState(false);

  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  // AuthContext builds a new `user` object every render; the id is stable.
  const userId = user?.id ?? null;

  // Logged out here means they cancelled the OAuth screen or opened the link
  // directly. Ask on this page rather than bouncing them back — the popup
  // returns them to this same page. Derived, not set from an effect; the only
  // state is whether they closed it.
  const needsLogin = !authLoading && !isAuthenticated;
  const showLoginModal = needsLogin && !loginDismissed;

  // One link attempt per page visit — StrictMode runs effects twice in dev,
  // and a second PATCH while the first is in flight is pointless.
  const attachRequestedRef = useRef(false);

  // Make sure the session belongs to the logged-in customer before they fill
  // in an address. The preview page's login popup sends a logged-out customer
  // straight here after Google/Facebook, so this page — not the preview — is
  // where an anonymous session first meets its account. PaymentButton (and the
  // backend's checkout) need `userId` set, so without this Pay would stay
  // disabled with no explanation.
  useEffect(() => {
    // Logged out is handled by the popup (see needsLogin above).
    if (authLoading || !isAuthenticated || !userId) return;

    const leaveForOtherAccount = () => {
      toast.error(OTHER_ACCOUNT_MESSAGE);
      router.replace(`/personalize/${sessionId}/preview`);
    };

    // Already linked — to this customer (nothing to do) or to someone else.
    if (snapshot.userId) {
      if (snapshot.userId !== userId) leaveForOtherAccount();
      return;
    }

    if (attachRequestedRef.current) return;
    attachRequestedRef.current = true;

    (async () => {
      try {
        await attachUser(sessionId);
        setSnapshot(await getSession(sessionId));
      } catch (err) {
        // 409 = the session already belongs to another account.
        if ((err as { code?: string } | null)?.code === "CONFLICT") {
          leaveForOtherAccount();
          return;
        }

        attachRequestedRef.current = false;
        console.error("Failed to link session to account on checkout", err);
        toast.error("We couldn't link this order to your account. Please reload and try again.");
      }
    })();
  }, [authLoading, isAuthenticated, userId, snapshot.userId, sessionId, router]);

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

        {/* The popup can be dismissed; this keeps a way back to it. */}
        {needsLogin && !showLoginModal && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm font-medium">
            <span className="flex-1">Please log in to add your address and complete your order.</span>
            <button
              type="button"
              onClick={() => setLoginDismissed(false)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#3F3C95] hover:bg-[#3F3C95]/90 text-white font-bold rounded-full transition-colors cursor-pointer"
            >
              <LogIn size={16} />
              Log in
            </button>
          </div>
        )}

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

      {/* No callbackPath: returning to this page is exactly what we want. */}
      <LoginModal
        isOpen={showLoginModal}
        onOpenChange={(open) => setLoginDismissed(!open)}
      />
    </div>
  );
}
