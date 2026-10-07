import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import ContactForm from "@/components/shared/ContactForm";
import { fetchPublicSiteSetting } from "@/app/actions/public";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";

export const metadata: Metadata = {
  title: "Contact Us",
};

/** Rendered per request — see the note in app/privacy/page.tsx. */
export const dynamic = "force-dynamic";

/** One contact channel. Renders nothing when the admin has not filled it in. */
function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  href?: string;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-[#F8E7D2] text-[#8E4A92] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-[#8E4A92] mb-0.5">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="text-[#222222] font-medium hover:text-[#8E4A92] transition-colors break-words"
          >
            {value}
          </a>
        ) : (
          <p className="text-[#222222] font-medium break-words whitespace-pre-line">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function ContactPage() {
  // Never throws — returns null when nothing has been saved yet.
  const setting = await fetchPublicSiteSetting();

  const addressLines = [
    setting?.addressLine1,
    setting?.addressLine2,
    [setting?.city, setting?.state, setting?.zip].filter(Boolean).join(", "),
    setting?.country,
  ]
    .filter((line) => line && line.trim().length > 0)
    .join("\n");

  // Strip non-digits so the tel:/wa.me links work regardless of how the admin
  // formatted the number.
  const phoneHref = setting?.phone ? `tel:${setting.phone.replace(/[^\d+]/g, "")}` : undefined;
  const whatsappHref = setting?.whatsappPhone
    ? `https://wa.me/${setting.whatsappPhone.replace(/\D/g, "")}`
    : undefined;

  const hasAnyDetail =
    !!setting?.email ||
    !!setting?.phone ||
    !!setting?.whatsappPhone ||
    !!setting?.businessHours ||
    addressLines.length > 0;

  return (
    <main className="min-h-screen bg-[#F8E7D2] flex flex-col">
      <HomeHeaderSection />

      <section className="flex-1 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-32 w-full">
        {/* Intro */}
        <header className="mb-12 text-center">
          <h1
            className={`${chauPhilomeneOne.className} text-4xl md:text-5xl text-[#222222] mb-4 leading-tight`}
          >
            {setting?.headline || "Contact Us"}
          </h1>
          <p
            className={`${hankenGrotesk.className} text-[#555555] max-w-2xl mx-auto`}
          >
            {setting?.description ||
              "Have a question about your book or an order? Send us a message and we will get back to you."}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Details */}
          {hasAnyDetail && (
            <aside className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-[#E5E7EB] space-y-6">
                <ContactRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={setting?.email ?? null}
                  href={setting?.email ? `mailto:${setting.email}` : undefined}
                />
                <ContactRow
                  icon={<Phone className="w-4 h-4" />}
                  label="Phone"
                  value={setting?.phone ?? null}
                  href={phoneHref}
                />
                <ContactRow
                  icon={<MessageCircle className="w-4 h-4" />}
                  label="WhatsApp"
                  value={setting?.whatsappPhone ?? null}
                  href={whatsappHref}
                />
                <ContactRow
                  icon={<Clock className="w-4 h-4" />}
                  label="Hours"
                  value={setting?.businessHours ?? null}
                />
                <ContactRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Address"
                  value={addressLines || null}
                />
              </div>

              {setting?.mapEmbedUrl && (
                <div className="mt-6 rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
                  <iframe
                    src={setting.mapEmbedUrl}
                    title="Our location"
                    className="w-full h-64 border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              )}
            </aside>
          )}

          {/* Form — always rendered. On a fresh install with no details saved,
              this is the only way for a visitor to reach anyone.

              Writes to contact_enquiries, NOT feedbacks: an enquiry here is a
              question expecting an answer, which is a different inbox from the
              homepage's anonymous book suggestions. */}
          <div className={hasAnyDetail ? "lg:col-span-3" : "lg:col-span-5"}>
            <ContactForm />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
