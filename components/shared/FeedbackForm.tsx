"use client";

import { useState } from "react";
import { hankenGrotesk } from "@/app/fonts";
import { submitPublicFeedback } from "@/app/actions/public";
import { getErrorMessage } from "@/lib/utils";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FeedbackFormProps {
  /** Copy for the textarea. Differs between the home FAQ block and /contact. */
  messagePlaceholder?: string;
  submitLabel?: string;
  /** Extra classes on the white card wrapper, for per-page spacing. */
  className?: string;
}

const inputClass = `
  ${hankenGrotesk.className}
  w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3
  outline-none focus:ring-2 focus:ring-[#8E4A92]/20 focus:border-[#8E4A92]
  text-[#222222] placeholder-[#888888] text-sm sm:text-base font-medium
  transition-all
`;

/**
 * The homepage "Feedback & Suggestion" form.
 *
 * Collects name and message only. Email and phone are deliberately absent —
 * feedback has no reply channel by design, which is why the success copy below
 * promises nothing back.
 *
 * /contact no longer renders this. It has its own ContactForm writing to its
 * own table, because an enquiry expects an answer and a suggestion does not.
 * Do not re-merge the two: sharing one form is exactly how both ended up in a
 * single untriagable inbox.
 */
export default function FeedbackForm({
  messagePlaceholder = "Write your feedback & Suggestions for our books *",
  submitLabel = "Submit Feedback",
  className = "",
}: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Captured before the first await: React pools the event and
    // e.currentTarget is null by the time we want to reset the form.
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check. Stays indistinguishable from success so a bot learns
    // nothing — but it is logged, because a false positive here silently
    // destroys a real person's message. If this ever shows up in a genuine
    // user's console, the honeypot is misfiring and must be fixed, not tuned.
    if (formData.get("confirm_ref")) {
      console.warn(
        "Feedback form: honeypot tripped — submission was NOT sent. If you are a real user, this is a bug."
      );
      setIsSuccess(true);
      return;
    }

    const name = formData.get("name") as string;
    const message = formData.get("message") as string;

    try {
      setIsSubmitting(true);
      setError(null);
      await submitPublicFeedback({ name, message });
      setIsSuccess(true);
      form.reset();
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Failed to submit feedback. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`
        bg-white
        rounded-2xl
        p-5
        sm:p-6
        shadow-[0_4px_15px_rgba(0,0,0,0.03)]
        border border-[#E5E7EB]
        ${className}
      `}
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4
            className={`${hankenGrotesk.className} font-bold text-xl text-neutral-800 mb-2`}
          >
            Thank you for your feedback!
          </h4>
          <p className={`${hankenGrotesk.className} text-neutral-600`}>
            We read every message that comes in and use it to make our books
            better.
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="mt-6 px-6 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          {/*
            Honeypot. `display: none` on the wrapper, NOT `left: -9999px` —
            that distinction is load-bearing.

            An off-screen field is still rendered, so browser profile autofill
            treats it as a real input and can fill it, which trips the check
            above and silently discards a genuine message. `autocomplete="off"`
            does not prevent that; browsers ignore it for profile autofill.

            A display:none field is not rendered at all, so autofill skips it,
            while naive bots that fill every input in the DOM still walk in.
            The name is neutral for the same reason: "website_url" is a token
            autofill actively looks for.

            This form asks only for name and message, so it is less likely to
            be classified as an address form than /contact was — but the
            failure mode is identical, and it is silent.
          */}
          <div style={{ display: "none" }} aria-hidden="true">
            <label htmlFor="feedback-confirm-ref">Leave this field empty</label>
            <input
              id="feedback-confirm-ref"
              type="text"
              name="confirm_ref"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="sr-only">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your Name *"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="message" className="sr-only">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              maxLength={2000}
              rows={4}
              placeholder={messagePlaceholder}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                bg-[#8E4A92] hover:bg-[#7a3e7e] text-white
                px-8 py-3 rounded-xl font-bold shadow-sm
                transition-colors disabled:opacity-70 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                cursor-pointer
              "
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>{submitLabel}</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
