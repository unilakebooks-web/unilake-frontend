import type { MouseEvent } from "react";

/**
 * Next does not scroll when the address already ends in #faq, so after scrolling away a second click on a
 * /#faq link (Header, phone menu, Footer) did nothing. Only that case is handled here: a plain left click on
 * the home page, with the address already `#faq`. Every other click, including Ctrl/Cmd/Shift-click, is left to Next.
 */
export function scrollToFaqAgain(e: MouseEvent, href: string, pathname: string): void {
  if (href !== "/#faq" || pathname !== "/" || window.location.hash !== "#faq") return;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const faq = document.getElementById("faq");
  if (!faq) return;
  e.preventDefault();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  faq.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}
