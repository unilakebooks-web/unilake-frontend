"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { applyUnsubscribe, fetchUnsubscribeInfo } from "@/app/actions/email";
import type { UnsubscribeInfo, UnsubscribeScope } from "@/app/types/email";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/utils";

// ⚠️ The same address the order emails give (Unilake-backend notification.service.ts, SUPPORT_EMAIL).
const SUPPORT = "support@unilakekids.com";

const GENERIC_ERROR = "Something went wrong. Please try again.";

const ASK: Record<
  UnsubscribeScope,
  { heading: string; body: string; button: string }
> = {
  GLOBAL: {
    heading: "Stop these emails?",
    body: "You will stop getting promotions and reminders to buy or review from Unilake. You will still get emails about your orders.",
    button: "Yes, stop these emails",
  },
  ORDER_REMINDER: {
    heading: "Stop reminders about this book?",
    body: "We will stop reminding you about this book. Your order and your order emails are not affected, and you can still send the book to print from your dashboard.",
    button: "Yes, stop these reminders",
  },
};

/** The copy for a link; a link without a known scope is the general one. */
const askFor = (info: UnsubscribeInfo) => ASK[info.scope ?? "GLOBAL"];

type View =
  | { step: "loading" }
  | { step: "ask"; info: UnsubscribeInfo }
  | { step: "done"; scope: UnsubscribeScope }
  | { step: "expired" }
  | { step: "error"; message: string };

/**
 * Opening the link only shows a button; the button's POST does the unsubscribing, so a mail scanner that
 * opens every link in an email cannot unsubscribe anyone.
 */
export default function UnsubscribeView({ token }: { token: string }) {
  const [view, setView] = useState<View>(
    token ? { step: "loading" } : { step: "expired" },
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchUnsubscribeInfo(token)
      .then((info) => {
        if (!cancelled)
          setView(info.found ? { step: "ask", info } : { step: "expired" });
      })
      .catch((err) => {
        if (!cancelled)
          setView({
            step: "error",
            message: getErrorMessage(err, GENERIC_ERROR),
          });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    try {
      const { scope } = await applyUnsubscribe(token);
      setView({ step: "done", scope });
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      setView(
        code === "NOT_FOUND"
          ? { step: "expired" }
          : {
              step: "error",
              message: getErrorMessage(err, GENERIC_ERROR),
            },
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF8EE] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8 text-center">
        {view.step === "loading" ? (
          <div role="status">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#914A8C]" />
            <span className="sr-only">Loading</span>
          </div>
        ) : view.step === "ask" ? (
          <>
            <h1 className="text-xl font-bold text-neutral-900">
              {askFor(view.info).heading}
            </h1>
            <p className="text-sm text-neutral-600 mt-3">
              {askFor(view.info).body}
            </p>
            <Button
              onClick={confirm}
              disabled={busy}
              className="mt-6 w-full h-11 rounded-xl bg-[#914A8C] hover:bg-[#7d3f79] text-white font-semibold"
            >
              {askFor(view.info).button}
            </Button>
          </>
        ) : view.step === "done" ? (
          <>
            <h1 className="text-xl font-bold text-neutral-900">Done</h1>
            <p className="text-sm text-neutral-600 mt-3">
              {view.scope === "ORDER_REMINDER"
                ? "We will not remind you about this book again."
                : "You will not get these emails any more."}
            </p>
          </>
        ) : view.step === "expired" ? (
          <>
            <h1 className="text-xl font-bold text-neutral-900">
              This link has expired
            </h1>
            <p className="text-sm text-neutral-600 mt-3">
              Please write to{" "}
              <a
                href={`mailto:${SUPPORT}`}
                className="text-[#914A8C] underline"
              >
                {SUPPORT}
              </a>{" "}
              and we will remove you.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-neutral-900">
              Something went wrong
            </h1>
            <p className="text-sm text-red-600 mt-3">{view.message}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl"
            >
              Try again
            </Button>
          </>
        )}
        <Link
          href="/"
          className="block mt-6 text-xs text-neutral-500 underline"
        >
          Back to Unilake
        </Link>
      </div>
    </main>
  );
}
