"use client";

import { format } from "date-fns";
import { CreditCard, FileText, MapPin, Sparkles, User } from "lucide-react";
import type { AdminOrderDetail } from "@/app/types/order";

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-[#914A8C]">
        {icon}
        <h2 className="font-bold uppercase text-xs tracking-wider">{title}</h2>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-neutral-500 shrink-0">{label}</span>
      <span className="font-semibold text-neutral-900 text-right break-words min-w-0">
        {value ?? <span className="text-neutral-400 font-normal">—</span>}
      </span>
    </div>
  );
}

export function OrderInfoCards({ order }: { order: AdminOrderDetail }) {
  const { shipping, customer, payment, pdf, session, generatedCover } = order;

  const addressLines = [
    shipping.line1,
    shipping.line2,
    [shipping.city, shipping.state].filter(Boolean).join(", "),
    [shipping.zip, shipping.country].filter(Boolean).join(" "),
  ].filter(Boolean);

  const pdfExpired = pdf.pdfDownloadExpiry
    ? new Date(pdf.pdfDownloadExpiry) < new Date()
    : false;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Customer" icon={<User className="w-4 h-4" />}>
        <Field label="Notification email" value={customer.notificationEmail} />
        {/* Who paid, deliberately distinct from who receives — they differ on gifts. */}
        <Field label="Account name" value={customer.user?.name} />
        <Field label="Account email" value={customer.user?.email} />
        {!customer.user && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            No account attached — this session was never linked to a login.
          </p>
        )}
      </Card>

      <Card title="Shipping address" icon={<MapPin className="w-4 h-4" />}>
        <Field label="Recipient" value={shipping.name} />
        <Field
          label="Address"
          value={
            addressLines.length ? (
              <span className="block whitespace-pre-line">{addressLines.join("\n")}</span>
            ) : null
          }
        />
        <Field label="Phone" value={shipping.phone} />
        <p className="text-xs text-neutral-400 pt-2 border-t border-neutral-100">
          Frozen snapshot taken at order time — edits to a saved address never change this.
        </p>
      </Card>

      <Card title="Payment" icon={<CreditCard className="w-4 h-4" />}>
        <Field
          label="Amount"
          value={
            <span className="text-base">
              {order.currency} {order.amount}
            </span>
          }
        />
        <Field label="Cover type" value={order.coverType} />
        <Field label="Pricing country" value={order.countryCode} />
        <Field
          label="Razorpay order"
          value={
            payment.razorpayOrderId ? (
              <span className="font-mono text-xs">{payment.razorpayOrderId}</span>
            ) : null
          }
        />
        <Field
          label="Razorpay payment"
          value={
            payment.razorpayPaymentId ? (
              <span className="font-mono text-xs">{payment.razorpayPaymentId}</span>
            ) : null
          }
        />
      </Card>

      <Card title="Book & child" icon={<Sparkles className="w-4 h-4" />}>
        <div className="flex gap-4 items-start">
          {/*
            The generated page-1 cover — the personalised page this child's book
            opens on. Deliberately NOT falling back to comic.coverThumbnailUrls:
            the template thumbnail is identical for every customer, so showing it
            here would look like a generated cover and mislead whoever is
            checking what actually shipped.

            No fixed height, and object-contain, because page artwork has no
            fixed aspect ratio — the image defines its own height rather than
            being cropped into a guessed box.
          */}
          <div className="w-36 shrink-0">
            {generatedCover ? (
              <>
                <a
                  href={generatedCover.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open full size"
                  className="block rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 hover:border-[#914A8C]/50 hover:opacity-90 transition-all"
                >
                  <img
                    src={generatedCover.imageUrl}
                    alt={`Generated cover for ${session.childName ?? "this order"}`}
                    className="w-full h-auto object-contain"
                  />
                </a>
                <p className="text-[11px] text-neutral-400 mt-1.5 text-center">
                  Variant {generatedCover.variantIndex} ·{" "}
                  {generatedCover.isSelected ? "printed" : "not yet confirmed"}
                </p>
              </>
            ) : (
              <>
                <div className="w-full h-48 rounded-lg bg-neutral-100 border border-neutral-200" />
                <p className="text-[11px] text-neutral-400 mt-1.5 text-center">
                  Cover not generated yet.
                </p>
              </>
            )}
          </div>
          <div className="flex-1 space-y-2.5 min-w-0">
            <Field label="Comic" value={session.comic.title} />
            <Field label="Child" value={session.childName} />
            <Field label="Age" value={session.age} />
            <Field label="Pronoun" value={session.pronounKey} />
          </div>
        </div>
      </Card>

      <Card title="Print-ready PDF" icon={<FileText className="w-4 h-4" />}>
        {pdf.pdfDownloadUrl ? (
          <>
            {pdfExpired ? (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                The signed download link expired on{" "}
                {format(new Date(pdf.pdfDownloadExpiry!), "MMM d, yyyy")}. It needs to be
                regenerated before the PDF can be downloaded again.
              </p>
            ) : (
              <a
                href={pdf.pdfDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </a>
            )}
            {pdf.pdfDownloadExpiry && !pdfExpired && (
              <p className="text-xs text-neutral-400">
                Link valid until {format(new Date(pdf.pdfDownloadExpiry), "MMM d, yyyy")}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-neutral-500">
            Not compiled yet — the PDF is built after the customer sends the book to print.
          </p>
        )}
      </Card>
    </div>
  );
}
