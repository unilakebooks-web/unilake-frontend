import Image from "next/image";
import { Lock } from "lucide-react";

interface LockedPageOverlayProps {
  /** The page's raw artwork. Null when the admin has not uploaded it yet. */
  artworkUrl: string | null;
  pageNumber: number;
}

/**
 * The paywall shown over a page the customer has not bought yet.
 *
 * The real artwork sits behind a blurred scrim, so a locked page reads as "a
 * real page exists here" rather than as a blank box. The blur is deliberately
 * cosmetic — the URL is in the session response and the unblurred art is one
 * devtools click away. It rests on the existing position that blank-bubble
 * artwork, with no face swap and no personalisation, is not the sellable
 * product.
 *
 * The blur lives on the scrim as `backdrop-blur`, not as a `blur` filter on the
 * image. A filter blur bleeds transparent edges and needs a scale hack to hide
 * them; backdrop-blur inside the card's existing overflow-hidden has no such
 * artifact.
 */
export default function LockedPageOverlay({
  artworkUrl,
  pageNumber,
}: LockedPageOverlayProps) {
  return (
    <>
      {artworkUrl && (
        // Still optimised hard — there is no reason to ship the 4-5MB print
        // master behind a scrim. But quality tracks the blur: at the old 10px
        // the artwork was illegible and q40 was free, whereas at 5px the page
        // is meant to be made out, and q40's blockiness would read as a
        // compression fault rather than a deliberate veil. q65 is still only
        // ~60KB of WebP. Raise this again if the blur is lowered further.
        // Decorative, so alt="" and aria-hidden — the heading below already
        // carries the meaning.
        <Image
          src={artworkUrl}
          alt=""
          aria-hidden="true"
          fill
          sizes="600px"
          quality={75}
          className="object-cover select-none pointer-events-none"
        />
      )}

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10 rounded-sm ${
          artworkUrl
            ? // THE BLUR KNOB. Halved from 10px so a locked page reads as a
              // real, recognisable page rather than a smear. The white scrim
              // stays at /30 — with less blur it is what keeps the heading
              // legible over a busy or pale page, so lower it separately and
              // only if the text still passes contrast.
              "bg-white/30 backdrop-blur-[4px]"
            : // No artwork to blur — fall back to the flat box this component
              // rendered before, so the card is never a transparent hole.
              "bg-gray-100/80 backdrop-blur-sm"
        }`}
      >
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4 text-[#3F3C95]">
          <Lock size={32} />
        </div>
        {/* drop-shadow on the text: the scrim is light enough to let the
            artwork through, and a pale page would otherwise wash this out. */}
        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
          Locked Page
        </h3>
        <p className="text-gray-700 text-lg max-w-sm font-medium drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
          Purchase the comic to see all pages and complete the story.
        </p>
        <span className="sr-only">Page {pageNumber} is locked.</span>
      </div>
    </>
  );
}
