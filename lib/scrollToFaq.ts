import type { MouseEvent } from "react";

// Images above the FAQ can still be loading when a visitor clicks quickly; when they arrive the section moves down
// while the scroll position stays put. After a jump the section is re-aligned if it drifts, checked this often, for
// this long, and ignoring sub-pixel rounding below the tolerance.
const REALIGN_EVERY_MS = 100;
const REALIGN_FOR_MS = 2000;
const REALIGN_TOLERANCE_PX = 2;

// Anything that means the visitor (or the browser, on Back and Forward) is now in charge of the scroll position.
const STOP_REALIGN_EVENTS = ["wheel", "touchstart", "keydown", "mousedown", "popstate", "hashchange"] as const;

// Stops the realign that is running, if any, so that a later click's own scroll is never fought.
let stopRealign: (() => void) | null = null;

/** Keeps `faq` at its scroll margin while the page settles; stops at once when the visitor takes over. */
function keepAligned(faq: HTMLElement): void {
  let interval = 0;
  let timeout = 0;
  const stop = () => {
    window.clearInterval(interval);
    window.clearTimeout(timeout);
    STOP_REALIGN_EVENTS.forEach((name) => window.removeEventListener(name, stop));
    if (stopRealign === stop) stopRealign = null;
  };
  stopRealign = stop;
  interval = window.setInterval(() => {
    // Left the page or the #faq address (for example by Back): nothing to keep in place any more.
    if (!faq.isConnected || window.location.hash !== "#faq") {
      stop();
      return;
    }
    const margin = parseFloat(window.getComputedStyle(faq).scrollMarginTop) || 0;
    if (Math.abs(faq.getBoundingClientRect().top - margin) > REALIGN_TOLERANCE_PX) faq.scrollIntoView({ behavior: "auto" });
  }, REALIGN_EVERY_MS);
  timeout = window.setTimeout(stop, REALIGN_FOR_MS);
  STOP_REALIGN_EVENTS.forEach((name) => window.addEventListener(name, stop, { passive: true }));
}

/**
 * Scrolls to the FAQ heading itself when a /#faq link (Header, phone menu, Footer) is clicked on the home page.
 *
 * Left to Next, that click is a navigation: it fetches the whole home page from the server and scrolls only when
 * the answer arrives, so a slow or stalled request made the link look dead. And when the address already ends in
 * #faq, Next does not scroll at all, so a second click after scrolling away did nothing.
 *
 * Here the scroll happens at once and the address is set to /#faq ourselves (a new history entry, as Next made).
 * A first click jumps, as before, and is kept aligned while the page settles; a repeat click animates unless the
 * visitor prefers reduced motion. Plain left clicks on the home page only: Ctrl/Cmd/Shift/Alt-clicks, other pages
 * and a missing section are left to Next.
 */
export function scrollToFaq(e: MouseEvent, href: string, pathname: string): void {
  if (href !== "/#faq" || pathname !== "/") return;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const faq = document.getElementById("faq");
  if (!faq) return;
  e.preventDefault();
  stopRealign?.();
  const again = window.location.hash === "#faq";
  if (!again) window.history.pushState(null, "", "/#faq");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  faq.scrollIntoView({ behavior: again && !reduceMotion ? "smooth" : "auto" });
  if (!again) keepAligned(faq);
}
