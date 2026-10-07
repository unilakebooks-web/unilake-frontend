"use client";

import { useState } from "react";
import { hankenGrotesk } from "@/app/fonts";
import { submitContactEnquiry } from "@/app/actions/public";
import { getErrorMessage } from "@/lib/utils";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface ContactFormProps {
  /** Copy for the textarea. */
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
 * The /contact enquiry form.
 *
 * A separate component from FeedbackForm rather than the same one behind a
 * flag. The two look alike but are opposites: feedback is an anonymous
 * suggestion that nobody replies to, an enquiry is a question that someone has
 * to answer. Branching one component on which it is today is precisely how the
 * two ended up sharing an inbox — so they stay apart, and can diverge freely.
 *
 * Collects name, email, phone and message, all required. The success copy
 * promises a reply because, unlike feedback, this one actually has a channel
 * to reply on.
 */
export default function ContactForm({
  messagePlaceholder = "How can we help? *",
  submitLabel = "Send Message",
  className = "",
}: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Captured before the first await: React pools the event and
    // e.currentTarget is null by the time we want to reset the form.
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check. Stays indistinguishable from success so a bot learns
    // nothing — but it is logged, because a false positive here silently
    // destroys a real customer's enquiry. If this ever shows up in a genuine
    // user's console, the honeypot is misfiring again and must be fixed, not
    // tuned.
    if (formData.get("confirm_ref")) {
      console.warn(
        "Contact form: honeypot tripped — submission was NOT sent. If you are a real user, this is a bug."
      );
      setIsSuccess(true);
      return;
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;

    try {
      setIsSubmitting(true);
      setError(null);
      await submitContactEnquiry({ name, email, phone, message });
      setIsSuccess(true);
      form.reset();
    } catch (err: unknown) {
      setError(
        getErrorMessage(err, "Failed to send your message. Please try again.")
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
            Message sent!
          </h4>
          <p className={`${hankenGrotesk.className} text-neutral-600`}>
            Thanks for reaching out — we&apos;ll get back to you on the email or
            number you provided.
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="mt-6 px-6 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/*
            Honeypot. `display: none` on the wrapper, NOT `left: -9999px` —
            that distinction is load-bearing.

            An off-screen field is still rendered, so Chrome's profile autofill
            treats it as a real input. This form asks for name, email and phone,
            which makes the browser read it as an address form and fill every
            field it recognises — including one named "website_url". That
            tripped the check below and silently threw away genuine enquiries.
            `autocomplete="off"` does not prevent this; browsers ignore it for
            profile autofill.

            A display:none field is not rendered at all, so autofill skips it,
            while naive bots that fill every input in the DOM still walk in.
            The name is neutral for the same reason: "website_url" is a token
            autofill actively looks for.
          */}
          <div style={{ display: "none" }} aria-hidden="true">
            <label htmlFor="contact-confirm-ref">Leave this field empty</label>
            <input
              id="contact-confirm-ref"
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
            <label htmlFor="contact-name" className="sr-only">
              Name
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Your Name *"
              className={inputClass}
            />
          </div>

          {/* Email and phone share a row from sm: up — they are both short
              fields, and stacking all four makes the form look longer than it
              is, which costs completions. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-email" className="sr-only">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Your Email *"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="contact-phone" className="sr-only">
                Contact number
              </label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="Contact Number *"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-message" className="sr-only">
              Message
            </label>
            <textarea
              id="contact-message"
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
