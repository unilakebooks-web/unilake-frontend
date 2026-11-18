"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * A thin bar along the top of the screen while a click on a link is waiting for the next page.
 *
 * Pages that are built on the server on every visit show nothing until the server answers, so a slow answer
 * looked like a button that did nothing. Quick navigations never show the bar (see SHOW_AFTER_MS), and neither do
 * links that stay on the same page (#faq, ?tab=), links that open elsewhere, and clicks with a modifier key.
 *
 * Limits, on purpose: it reacts to clicks on links only, not to buttons that navigate from code (router.push). It
 * cannot tell a click that leads nowhere (the link redirects straight back to this page, or a handler cancels the
 * navigation) from a slow one, so in that case it clears itself after GIVE_UP_AFTER_MS.
 */

// A navigation that finishes within this time shows no bar, so fast clicks do not flicker.
const SHOW_AFTER_MS = 150;
// If the page has still not changed after this long, stop showing the bar rather than leave it up for ever. The bar
// also takes this long to fill, so it is nearly full when it gives up.
const GIVE_UP_AFTER_MS = 30000;

function ProgressBar() {
  // True from a click on a link that leaves this page until the page changes (this component is then recreated,
  // see the key below) or GIVE_UP_AFTER_MS has passed.
  const [pending, setPending] = useState(false);
  const [waitedLongEnough, setWaitedLongEnough] = useState(false);

  useEffect(() => {
    let showTimer: number | undefined;
    let giveUpTimer: number | undefined;

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;

      window.clearTimeout(showTimer);
      window.clearTimeout(giveUpTimer);
      setWaitedLongEnough(false);
      setPending(true);
      showTimer = window.setTimeout(() => setWaitedLongEnough(true), SHOW_AFTER_MS);
      giveUpTimer = window.setTimeout(() => setPending(false), GIVE_UP_AFTER_MS);
    };

    // A page restored from the browser's back-forward cache comes back exactly as it was left, including a pending bar.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      window.clearTimeout(showTimer);
      window.clearTimeout(giveUpTimer);
      setWaitedLongEnough(false);
      setPending(false);
    };

    document.addEventListener("click", onClick);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("pageshow", onPageShow);
      window.clearTimeout(showTimer);
      window.clearTimeout(giveUpTimer);
    };
  }, []);

  const visible = pending && waitedLongEnough;

  return (
    <>
      <div
        aria-hidden="true"
        // z-[200]: above the header, the announcement banner and the phone menu drawer (z-[101]).
        className={`pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Fills slowly towards (not to) the right edge. The transition is only on while showing, so hiding resets it at once. */}
        <div
          className="h-full origin-left bg-[#FFD54A] shadow-[0_0_6px_rgba(63,60,149,0.7)]"
          style={{
            transform: visible ? "scaleX(0.95)" : "scaleX(0.05)",
            transition: visible ? `transform ${GIVE_UP_AFTER_MS}ms cubic-bezier(0.1, 0.6, 0.3, 1)` : "none",
          }}
        />
      </div>
      <span role="status" className="sr-only">
        {visible ? "Loading page" : ""}
      </span>
    </>
  );
}

export default function NavigationProgress() {
  const pathname = usePathname();
  // Keyed on the page, so everything above starts afresh whenever the page changes, including on Back and Forward.
  return <ProgressBar key={pathname} />;
}
