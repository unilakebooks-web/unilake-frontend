import {
  Geist,
  Geist_Mono,
  Poppins,
  Chau_Philomene_One,
  Hanken_Grotesk,
  Protest_Strike,
  Boogaloo,
} from "next/font/google";
import localFont from "next/font/local";

export const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const chauPhilomeneOne = Chau_Philomene_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-chau-philomene-one",
});

export const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const protestStrike = Protest_Strike({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-protest-strike",
});

// FAQ's & Feedback headings (home + comic page bands) and the
// "Feedback & Suggestion" sub-heading. Google ships a single 400 weight, so
// never pair it with font-bold/extrabold — the browser would fake a bold.
export const boogaloo = Boogaloo({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-boogaloo",
});

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