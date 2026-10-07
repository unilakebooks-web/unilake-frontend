"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RegenerateResponse,
  SendToPrintSelection,
  SessionPage,
  SessionSnapshot,
} from "@/app/types/session";
import { usePublicComic } from "@/hooks/usePublicComics";
import { useRotatingFact } from "@/hooks/useRotatingFact";
import PreviewProgress from "./PreviewProgress";
import PreviewPageCard from "./PreviewPageCard";
import PricingSection from "./PricingSection";
import CheckoutBar from "./CheckoutBar";
import SendToPrintSection from "./SendToPrintSection";
import SendToPrintBar from "./SendToPrintBar";
import SendToPrintConfirmModal from "./SendToPrintConfirmModal";
import UploadAnotherPhotoBanner from "./UploadAnotherPhotoBanner";
import Image from "next/image";
import { ChevronDown, ImageIcon, ArrowLeftRight } from "lucide-react";
import { chauPhilomeneOne, hankenGrotesk } from "@/app/fonts";
import LoginModal from "../checkout/LoginModal";
import { useCheckoutFlow } from "@/hooks/useCheckoutFlow";
import { useSendToPrintFlow } from "@/hooks/useSendToPrintFlow";

/** Highest variantIndex that has actually finished, or null if none have. */
function newestReadyIndex(page: SessionPage): number | null {
  const ready = page.variants.filter((v) => v.status === "SD_READY");
  if (ready.length === 0) return null;
  return Math.max(...ready.map((v) => v.variantIndex));
}

interface PreviewViewerProps {
  snapshot: SessionSnapshot;
  status: string;
  pagesReady: number;
  /** Denominator for progress: /generate's jobsEnqueued, or the snapshot's own
   *  preview-page count once that in-memory value is lost to a refresh. */
  totalPreviewPages: number;
  onRegenerate: (pageNumber: number) => Promise<RegenerateResponse | undefined>;
  /** Checkout started but not paid: preview only, cover locked, payment resumes. */
  isAwaitingPayment?: boolean;
  /** Payment captured — every page unlocked. */
  isPaid?: boolean;
  /** Paid AND sent to print — read-only, printed variants only. */
  isSentToPrint?: boolean;
  paidPagesReady?: number;
  totalPaidPages?: number;
}

export default function PreviewViewer({
  snapshot,
  status,
  pagesReady,
  totalPreviewPages,
  onRegenerate,
  isAwaitingPayment = false,
  isPaid,
  isSentToPrint = false,
  paidPagesReady = 0,
  totalPaidPages = 0,
}: PreviewViewerProps) {
  const { data: comicDetail } = usePublicComic(snapshot.comicId);

  // Rotated ONCE here and handed to every card, so all the "GENERATING…" boxes
  // on the page show the same fact and change together. Running the hook inside
  // each card would leave them drifting out of step within seconds.
  const generatingFacts = useMemo(
    () =>
      (comicDetail?.facts ?? [])
        .filter((fact) => fact.placement === "GENERATING")
        .map((fact) => fact.text),
    [comicDetail?.facts]
  );
  const generatingFact = useRotatingFact(generatingFacts);

  const isGeneratingSession = status === "GENERATING_PREVIEW";
  // PAID is the brief hop before the webhook flips to GENERATING_PAID. Showing
  // the bar from PAID means a customer arriving from their orders page sees
  // progress straight away rather than a book of blank placeholders.
  const isGeneratingPaid = status === "GENERATING_PAID" || status === "PAID";

  const coverUrl = snapshot.comic.coverThumbnailUrls?.[0];

  // Only the pages the user has deliberately navigated. Everything else falls
  // back to the newest finished variant, so variants arriving over the socket
  // surface on their own without ever overwriting a deliberate pick.
  const [overrides, setOverrides] = useState<Map<number, number>>(() => new Map());

  // Stable — PreviewPageCard lists it in an effect's dependencies.
  const handleVariantChange = useCallback((pageNumber: number, variantIndex: number) => {
    setOverrides((prev) => new Map(prev).set(pageNumber, variantIndex));
  }, []);

  // What a card renders. Honours the override even when it points at a variant
  // that is still generating — watching a regeneration land is the whole reason
  // pending variants are navigable.
  const displayIndex = (page: SessionPage): number | null =>
    overrides.get(page.pageNumber) ?? newestReadyIndex(page);

  // Pages that have given up: no finished variant, and at least one variant that
  // exhausted its retries. A page merely still generating has neither, so it is
  // correctly not counted here.
  //
  // Scoped to preview pages because this gates the pre-payment checkout — locked
  // pages have not been generated yet and must not block the sale.
  const failedPreviewPages = useMemo(
    () =>
      snapshot.pages
        .filter(
          (page) =>
            page.isPreviewPage &&
            newestReadyIndex(page) === null &&
            page.variants.some((v) => v.status === "FAILED")
        )
        .map((page) => page.pageNumber),
    [snapshot.pages]
  );

  // Called ONCE for the whole page. Cover selection, the in-flight flag and the
  // login modal all live here, so the floating CheckoutBar and the full
  // PricingSection below the last page show the same choice, and a single
  // modal serves both.
  const checkout = useCheckoutFlow({
    sessionId: snapshot.id,
    snapshot,
    failedPageNumbers: failedPreviewPages,
  });

  // Spread into both the bar and the full section, so they can never drift
  // apart — there is exactly one prop set.
  const pricingProps = {
    locked: checkout.isResume,
    comicId: snapshot.comicId,
    failedPageNumbers: failedPreviewPages,
    selectedFormat: checkout.selectedFormat,
    onSelectFormat: checkout.setSelectedFormat,
    isUpdating: checkout.isUpdating,
    isCheckoutDisabled: checkout.isCheckoutDisabled,
    onCheckout: checkout.handleCheckout,
  };

  const { selections, blockedPages, hasInFlight } = useMemo(() => {
    const sel: SendToPrintSelection[] = [];
    const blocked: number[] = [];
    let inFlight = false;

    for (const page of snapshot.pages) {
      // Mirrors the backend's own in-flight rejection: anything not yet settled.
      if (page.variants.some((v) => v.status !== "SD_READY" && v.status !== "FAILED")) {
        inFlight = true;
      }

      // Unlike displayIndex, this never resolves to an unfinished variant — the
      // backend rejects any selection that isn't SD_READY.
      const override = overrides.get(page.pageNumber);
      const index =
        override !== undefined &&
        page.variants.some((v) => v.variantIndex === override && v.status === "SD_READY")
          ? override
          : newestReadyIndex(page);

      if (index === null) blocked.push(page.pageNumber);
      else sel.push({ pageNumber: page.pageNumber, variantIndex: index });
    }

    return { selections: sel, blockedPages: blocked, hasInFlight: inFlight };
  }, [snapshot.pages, overrides]);

  // The backend requires exactly one selection per Comic.pageCount. If an admin
  // created fewer Page rows than pageCount, send-to-print can never succeed and
  // no amount of regenerating fixes it. Undefined while the comic is loading.
  const pageCountMismatch =
    comicDetail !== undefined && snapshot.pages.length !== comicDetail.pageCount;

  // Send to Print is offered from the moment payment lands, not only once every
  // page is done: while pages are still being made (the first paid run, or a
  // regeneration) the button stays visible and a click explains the wait.
  const showSendToPrint = isGeneratingPaid || status === "PAID_PAGES_READY";

  // Called ONCE, like useCheckoutFlow: the full section and the floating bar
  // read the same state, and one confirm + one login dialog serve both.
  const sendToPrint = useSendToPrintFlow({
    sessionId: snapshot.id,
    comicId: snapshot.comicId,
    selections,
    blockedPages,
    isGenerating: isGeneratingPaid || hasInFlight,
    pageCountMismatch,
  });

  // Which full-size section sits below the last page — and so which floating
  // bar mirrors it. Null once the book has been sent to print: nothing to do.
  const bottomSection: "checkout" | "print" | null = !isPaid
    ? "checkout"
    : showSendToPrint
      ? "print"
      : null;

  // ── Floating bar visibility (checkout before payment, print after) ────────
  //
  // The bar floats at the bottom of the screen only while BOTH hold:
  //   1. the first comic page has come into view (or been scrolled past), so
  //      it never covers the heading and intro at the top, and
  //   2. the full checkout section below the last page is still BELOW the
  //      screen. Once that section scrolls into view it takes over — the bar
  //      slides away and the full section sits in its place. Scrolling back up
  //      pushes the section below the screen again and the bar returns.
  //
  // "Below the screen" rather than "not visible" is deliberate: past the
  // section, down in the footer, it is off screen ABOVE, and the bar must not
  // come back over the footer.
  //
  // IntersectionObserver rather than a scroll listener: the browser reports
  // only the crossings, with no per-frame work on our side.
  //
  // The same rule drives both bars. `bottomSectionRef` is attached to whichever
  // full section is rendered, and the observer is rebuilt when that changes
  // (e.g. payment lands while the page is open and checkout becomes print).
  const firstPageRef = useRef<HTMLDivElement>(null);
  const bottomSectionRef = useRef<HTMLDivElement>(null);
  const [firstPageReached, setFirstPageReached] = useState(false);
  const [fullCheckoutBelow, setFullCheckoutBelow] = useState(true);

  useEffect(() => {
    if (bottomSection === null) return;

    const firstPage = firstPageRef.current;
    const fullCheckout = bottomSectionRef.current;
    if (!firstPage || !fullCheckout) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const { top, bottom } = entry.boundingClientRect;

        if (entry.target === firstPage) {
          // In view, or already scrolled past above the screen.
          setFirstPageReached(entry.isIntersecting || bottom < 0);
        } else {
          // Not in view AND its top edge is below the screen.
          setFullCheckoutBelow(!entry.isIntersecting && top > 0);
        }
      }
    });

    observer.observe(firstPage);
    observer.observe(fullCheckout);
    return () => observer.disconnect();
  }, [bottomSection]);

  const barWanted = firstPageReached && fullCheckoutBelow;
  const showCheckoutBar = bottomSection === "checkout" && barWanted;
  const showPrintBar = bottomSection === "print" && barWanted;

  return (
    // Same #F9E3C8 as the preloader and the page wrapper. Left at #F1E0CA this
    // would just move the seam — the preloader hands over to this view inside
    // the same page, so all three have to agree.
    <div className="w-full flex flex-col items-center bg-[#F9E3C8] min-h-screen py-12">
      
      {isGeneratingSession && (
        <PreviewProgress pagesReady={pagesReady} totalPages={totalPreviewPages} />
      )}
      
      {isGeneratingPaid && (
        <PreviewProgress
          pagesReady={paidPagesReady}
          totalPages={totalPaidPages}
          title="Creating the rest of your book..."
        />
      )}

      <div className="w-full max-w-4xl px-4 flex flex-col items-center gap-4">
        
        <div className="text-center mb-8 w-full mt-20 relative z-10">
          {/* Comic title. Read from the snapshot rather than comicDetail so it
              paints with the first render — comicDetail arrives from a separate
              query and would make the title pop in a beat later. Deliberately
              subordinate to the personalised heading below: the child's name is
              the hook on this page, the book is the context. */}
          <p className={`${hankenGrotesk.className} text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#3F3C95]/70 mb-2`}>
            {snapshot.comic.title}
          </p>

          <h2 className={`${chauPhilomeneOne.className} text-2xl md:text-4xl text-[#3F3C95]`}>
            {isSentToPrint
              ? "Your Printed Storybook"
              : isPaid
                ? "Your Complete Storybook"
                : `Preview for ${snapshot.childName || "Your Child"}`}
          </h2>

          {/* Description only exists on the public comic detail, so unlike the
              title it cannot render until that query resolves, and it is null
              for comics where no admin wrote one.

              Shown in full, no clamp. Safe to render as text: Comic.description
              is plain @db.Text, not the TipTap HTML that blogs and site pages
              carry — so no sanitiser is involved. whitespace-pre-line keeps any
              paragraph breaks the admin typed. */}
          {comicDetail?.description && (
            <p className={`${hankenGrotesk.className} mt-3 mx-auto max-w-2xl text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line`}>
              {comicDetail.description}
            </p>
          )}

          {/* Instructions for a book still being made and picked. Once it is
              printed there is nothing to watch or choose, so they go. */}
          {!isSentToPrint && (
            <div className="mt-4 flex flex-col items-center gap-2 text-gray-500 text-sm md:text-base font-medium">
              <span className="flex items-center gap-2">
                <ImageIcon size={18} className="text-[#3F3C95]" /> Watch the story come alive one page at a time!
              </span>
              <span className="flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-[#3F3C95]" /> Slide left or right to pick the best image
              </span>
            </div>
          )}
        </div>

        {/* Cover Page */}
        {/* {coverUrl && (
          <div className="flex flex-col items-center w-full max-w-[800px] mx-auto py-12">
            <div className="relative w-full rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-slate-100 ring-1 ring-black/5 aspect-[427/310]">
              <Image
                src={coverUrl}
                alt="Cover Page"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 800px"
                priority
              />
            </div>
            <div className="mt-4 font-bold text-gray-400 uppercase tracking-widest text-sm">
              Cover Page
            </div>
            <ChevronDown size={32} className="text-gray-300 mt-8 animate-bounce" />
          </div>
        )} */}

        {/* Sits above the first page and stays visible through every unpaid
            state, including while generation is running — in that case the
            button explains itself with a toast rather than navigating.
            Hidden once paid: starting a new session then would abandon the
            order the customer has already bought. */}
        {/* Desktop: a card beside the first comic page that follows the scroll.

            It lives HERE, after the heading, on purpose — a sticky element
            starts at its normal flow position, so sitting at this point in the
            column is what makes it begin level with the first page rather than
            up beside the title.

            The zero-height wrapper keeps it out of the layout: it takes no
            vertical space, so the centred page column is unmoved and the card
            floats over the background beside it. `-mb-4` cancels the flex gap
            the extra child would otherwise introduce.

            `left-[calc(50%-50vw+1.5rem)]` reaches the viewport's left edge from
            inside this centred column: 50% is half the column, 50vw is half the
            viewport, and the difference is exactly the gutter beside it. Plain
            `left-6` would put the card on top of the comic page, since offsets
            here resolve against the column, not the page.

            pointer-events are disabled on the full-width strip and re-enabled
            on the card itself, so the invisible wrapper never eats a click
            meant for a comic page underneath it.

            No JS is needed to stop at the footer: a sticky element is bound by
            its parent's box, and this column ends before the Footer. */}
        {/* Also hidden while awaiting payment: a fresh session from here would
            leave the unpaid order behind, and this session's photo is locked. */}
        {!isPaid && !isAwaitingPayment && (
          <div className="hidden lg:block sticky top-24 z-20 h-0 w-full -mb-4 pointer-events-none relative">
            <div className="absolute right-[calc(100%+1.5rem)] xl:right-[calc(100%+2.5rem)] top-0 pointer-events-auto">
              <UploadAnotherPhotoBanner
                sessionId={snapshot.id}
                status={snapshot.status}
                variant="floating"
              />
            </div>
          </div>
        )}

        {/* Mobile fallback. There is no room for a side rail at phone widths,
            so below lg it is a normal block above the first page. */}
        {!isPaid && !isAwaitingPayment && (
          <div className="lg:hidden w-full">
            <UploadAnotherPhotoBanner
              sessionId={snapshot.id}
              status={snapshot.status}
              variant="inline"
            />
          </div>
        )}

        {/* All pages. Checkout is no longer repeated between them — the
            floating CheckoutBar covers that while scrolling. */}
        {snapshot.pages.map((page, index) => {
          const comicPageMetadata = comicDetail?.pages.find(p => p.pageNumber === page.pageNumber);

          return (
            <div
              key={page.pageId}
              // The first page is the bar's start signal — see the observer.
              ref={index === 0 ? firstPageRef : undefined}
              className="w-full flex flex-col items-center"
            >
              <PreviewPageCard
                page={page}
                comicPageMetadata={comicPageMetadata}
                onRegenerate={onRegenerate}
                isGeneratingSession={isGeneratingSession || isGeneratingPaid}
                isPaid={isPaid}
                selectedVariantIndex={displayIndex(page)}
                onVariantChange={handleVariantChange}
                generatingFact={generatingFact}
                readOnly={isSentToPrint}
                canRegenerate={!isAwaitingPayment}
              />
              <ChevronDown size={32} className="text-gray-300 mt-4" />
            </div>
          );
        })}
      </div>

      {/* The full checkout section, once, below the last page. The wrapper is
          what the observer watches: when it scrolls into view the floating
          bar slides away and this takes its place. */}
      {bottomSection === "checkout" ? (
        <div ref={bottomSectionRef} className="w-full">
          <PricingSection {...pricingProps} />
        </div>
      ) : bottomSection === "print" ? (
        <div ref={bottomSectionRef} className="w-full">
          <SendToPrintSection
            blockReason={sendToPrint.blockReason}
            busy={sendToPrint.busy}
            onClick={sendToPrint.handleClick}
          />
        </div>
      ) : null}

      {/* Float over the pages until the full section above scrolls into view. */}
      {bottomSection === "checkout" && (
        <CheckoutBar {...pricingProps} visible={showCheckoutBar} />
      )}
      {bottomSection === "print" && (
        <SendToPrintBar
          visible={showPrintBar}
          blockReason={sendToPrint.blockReason}
          busy={sendToPrint.busy}
          onClick={sendToPrint.handleClick}
        />
      )}

      {/* Exactly one, shared by the checkout bar and the full section. */}
      <LoginModal
        isOpen={checkout.showLoginModal}
        onOpenChange={checkout.setShowLoginModal}
      />

      {/* Exactly one of each, shared by the print bar and the full section. */}
      {bottomSection === "print" && (
        <>
          <SendToPrintConfirmModal
            open={sendToPrint.confirmOpen}
            onOpenChange={sendToPrint.setConfirmOpen}
            onConfirm={sendToPrint.handleConfirm}
            isPending={sendToPrint.busy}
            pageCount={sendToPrint.pageCount}
            errorMessage={sendToPrint.errorMessage}
          />
          <LoginModal
            isOpen={sendToPrint.loginOpen}
            onOpenChange={sendToPrint.setLoginOpen}
            title="Log in to continue"
            description="Your session expired. Please sign in again to send your book to print."
          />
        </>
      )}
    </div>
  );
}
