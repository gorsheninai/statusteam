import localFont from "next/font/local";
import { Cormorant_Garamond } from "next/font/google";

/* Core project faces are self-hosted. Cormorant Garamond is loaded through
   next/font, downloaded at build time and self-hosted in the production bundle. */

/* DISPLAY — Tenor Sans. One weight only, by design; `font-synthesis: none`
   in globals.css stops the browser faking the bold this face does not have. */
const tenor = localFont({
  src: "../assets/fonts/TenorSans-Regular.woff2",
  variable: "--ff-tenor",
  weight: "400",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
});

/* BODY / UI — Onest, variable 100–900 in a single file. */
const onest = localFont({
  src: "../assets/fonts/Onest-Variable.woff2",
  variable: "--ff-onest",
  weight: "100 900",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "sans-serif"],
});

/* EDITORIAL — upright Playfair Display. */
const playfair = localFont({
  src: "../assets/fonts/PlayfairDisplay-Cyrillic-Variable.ttf",
  variable: "--ff-playfair",
  weight: "400 900",
  style: "normal",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

/* EDITORIAL ITALIC — Playfair Display Italic 400 retained for other editorial uses. */
const playfairItalic = localFont({
  src: "../assets/fonts/PlayfairDisplay-Italic-Cyrillic.ttf",
  variable: "--ff-playfair-italic",
  weight: "400",
  style: "italic",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

/* COUTURE ACCENT — Cormorant Garamond Medium Italic 500, OFL, Cyrillic. */
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  variable: "--ff-cormorant-garamond",
  weight: "500",
  style: "italic",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

/* HERO FASHION — Droid 1997 Regular (CC0). Retained as an available project
   face even though the current hero lock-up no longer uses it. */
const droid1997 = localFont({
  src: "../assets/fonts/Droid-1997-Regular.woff2",
  variable: "--ff-droid-1997",
  weight: "400",
  style: "normal",
  display: "swap",
  fallback: ["Arial Narrow", "Arial", "sans-serif"],
});

export const fontVariables = `${tenor.variable} ${onest.variable} ${playfair.variable} ${playfairItalic.variable} ${cormorantGaramond.variable} ${droid1997.variable}`;
