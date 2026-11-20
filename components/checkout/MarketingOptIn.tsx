"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  useMarketingConsent,
  useSaveMarketingConsent,
} from "@/hooks/useEmails";
import { getErrorMessage } from "@/lib/utils";

/**
 * The unticked "send me offers and news" box. It saves the moment it is ticked or unticked, on its own
 * request, so paying never depends on it and a failed save never blocks the payment. Shown to signed-in
 * customers only (the choice belongs to their account). The wording is stored on the server as version v1:
 * ⚠️ if this text changes, change MARKETING_CONSENT_WORDING_VERSION in the backend (config/reminders.ts).
 */
export default function MarketingOptIn({ userId }: { userId: string | null }) {
  const { data, isError } = useMarketingConsent(userId);
  const save = useSaveMarketingConsent();

  if (userId === null) return null;
  // An account whose address cannot be trusted (email and password, not verified) cannot tick the box, so
  // it is not offered (the server refuses it too).
  if (data && !data.canTick && !data.optedIn) return null;

  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={data?.optedIn ?? false}
        disabled={data === undefined || save.isPending}
        onChange={(e) =>
          save.mutate(e.target.checked, {
            onError: (err) =>
              toast.error(
                getErrorMessage(
                  err,
                  "Could not save your choice. Please try again.",
                ),
              ),
          })
        }
        className="mt-0.5 w-4 h-4 accent-[#914A8C] cursor-pointer"
      />
      <span className="text-xs text-[#555] leading-relaxed">
        Send me offers and news from Unilake by email. You can unsubscribe at
        any time.{" "}
        <Link href="/privacy" className="text-[#914A8C] underline">
          Privacy policy
        </Link>
        {isError ? (
          <span className="block text-red-600">
            Could not load your choice. Reload the page to try again.
          </span>
        ) : null}
      </span>
    </label>
  );
}
