import localFont from "next/font/local";

// The Google fonts below are self-hosted (public/fonts, rules in app/fonts.css) so a build does not depend on
// Google Fonts being reachable. Each export keeps the { className, variable } shape that next/font returned.
type SelfHostedFont = { className: string; variable: string };

export const geistSans: SelfHostedFont = { className: "ff-geist", variable: "ffv-geist-sans" };

export const geistMono: SelfHostedFont = { className: "ff-geist-mono", variable: "ffv-geist-mono" };

export const poppins: SelfHostedFont = { className: "ff-poppins", variable: "ffv-poppins" };

export const chauPhilomeneOne: SelfHostedFont = { className: "ff-chau", variable: "ffv-chau-philomene-one" };

export const hankenGrotesk: SelfHostedFont = { className: "ff-hanken", variable: "ffv-hanken-grotesk" };

export const protestStrike: SelfHostedFont = { className: "ff-protest", variable: "ffv-protest-strike" };

// FAQ's & Feedback headings (home + comic page bands) and the
// "Feedback & Suggestion" sub-heading. Google ships a single 400 weight, so
// never pair it with font-bold/extrabold — the browser would fake a bold.
export const boogaloo: SelfHostedFont = { className: "ff-boogaloo", variable: "ffv-boogaloo" };

// Checkout box on the preview page (PricingSection — the full section and the
// floating CheckoutBar). Licensed font, so it is self-hosted from
// app/fonts/frutiger/ rather than fetched from Google.
//
// Two real weights: Regular (400) and Bold (700). Use only font-normal and
// font-bold with it — medium/semibold/extrabold have no file and the browser
// would fake them.
//
// Neither file has a ₹ (or €) glyph, and every price in the box carries one.
// The explicit fallback makes the browser draw just that symbol from Arial /
// the system sans-serif instead of whatever it would otherwise pick.
export const frutiger = localFont({
  src: [
    { path: "./fonts/frutiger/Frutiger.ttf", weight: "400", style: "normal" },
    { path: "./fonts/frutiger/Frutiger_bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-frutiger",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});