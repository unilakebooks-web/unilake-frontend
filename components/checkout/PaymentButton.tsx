"use client";

import { useState } from "react";
import { SessionSnapshot } from "@/app/types/session";
import { initiateCheckout } from "@/app/actions/session";
import { loadRazorpayScript } from "@/app/lib/razorpay";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";
import { usePublicComic } from "@/hooks/usePublicComics";
import api from "@/app/lib/axios";

interface PaymentButtonProps {
  sessionId: string;
  snapshot: SessionSnapshot;
  onPaymentComplete: () => void;
  onPaymentDismissed: (status: string) => void;
}

export default function PaymentButton({
  sessionId,
  snapshot,
  onPaymentComplete,
  onPaymentDismissed,
}: PaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: comicDetail } = usePublicComic(snapshot.comicId);

  // Ready when user is attached, cover is picked, and all shipping fields exist
  const isReady =
    snapshot.userId &&
    snapshot.coverType &&
    snapshot.shippingName &&
    snapshot.shippingLine1 &&
    snapshot.shippingCity &&
    snapshot.shippingState &&
    snapshot.shippingZip &&
    snapshot.shippingCountry &&
    snapshot.shippingPhone;

  const handlePayNow = async () => {
    if (!isReady || isProcessing || !comicDetail) return;
    setIsProcessing(true);

    try {
      // 1. Load Razorpay script
      await loadRazorpayScript();

      // 2. Initiate checkout on backend
      const checkoutData = await initiateCheckout(sessionId);

      // 3. Open Razorpay modal
      const options = {
        key: checkoutData.razorpayKeyId,
        amount: checkoutData.amount, // in paise
        currency: checkoutData.currency,
        order_id: checkoutData.razorpayOrderId,
        name: "UniLake",
        description: `Order: ${comicDetail.title}`,
        prefill: {
          name: snapshot.shippingName || undefined,
          email: checkoutData.notificationEmail || undefined,
          contact: snapshot.shippingPhone || undefined,
        },
        theme: {
          color: "#3F3C95",
        },
        handler: function (response: any) {
          // Payment succeeded on Razorpay's end
          console.log("Razorpay payment success:", response.razorpay_payment_id);
          onPaymentComplete();
        },
        modal: {
          ondismiss: async function () {
            // User closed the modal. Check status.
            try {
              const { data: currentSnapshot } = await api.get<SessionSnapshot>(`/api/public/sessions/${sessionId}`);
              setIsProcessing(false);
              onPaymentDismissed(currentSnapshot.status);
            } catch (err) {
              setIsProcessing(false);
              onPaymentDismissed("AWAITING_PAYMENT");
            }
          },
          confirm_close: true,
        },
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        toast.error(response.error.description || "Payment failed. Please try again.");
        setIsProcessing(false);
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Checkout initiation failed:", error);
      toast.error(error.message || "Failed to start payment. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm flex flex-col items-center justify-center">
      <h2 className="text-xl font-bold text-[#3F3C95] mb-4 w-full text-left">Payment</h2>
      
      {!isReady ? (
        <p className="text-gray-500 mb-6 text-center text-sm font-medium">
          Please complete your order summary and shipping details first.
        </p>
      ) : null}

      <button
        onClick={handlePayNow}
        disabled={!isReady || isProcessing}
        className="w-full h-14 bg-[#FFD54A] hover:bg-[#ffcd2b] text-[#3F3C95] rounded-full font-black text-xl uppercase tracking-wider shadow-md hover:shadow-lg transition-all border-[3px] border-[#3F3C95] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" size={24} />
            Starting Payment...
          </>
        ) : (
          <>
            <CreditCard size={24} />
            Pay Now
          </>
        )}
      </button>
      
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 font-medium">
        <LockIcon /> Secure payment powered by Razorpay
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
