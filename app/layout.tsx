import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond } from "next/font/google";
import { PULSE_PATH } from "@/lib/pulse-path";
import TenetStepLock from "@/components/TenetStepLock";
import "./globals.css";
import "./hero-placement.css";
import "./status-team.css";
import "./status-team-fixes.css";
import "./status-team-lockup.css";
import "./experience-program.css";
import "./status-team-final.css";
import "./card-stack.css";
import "./premium-polish.css";
import "./status-team-page-two.css";
import "./faq-editorial.css";
import "./hero-type-final.css";
import "./page-two-type-final.css";
import "./hero-mobile-offer-final.css";
import "./tickets-preorder.css";

/* Core project faces are self-hosted. Cormorant Garamond is loaded through
   next/font, downloaded at build time and self-hosted in the production bundle. */

/* DISPLAY — Tenor Sans. One weight only, by design; `font-synthesis: none`
   in globals.css stops the browser faking the bold this face does not have. */
const tenor = localFont({
  src: "./fonts/TenorSans-Regular.woff2",
  variable: "--ff-tenor",
  weight: "400",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
});

/* BODY / UI — Onest, variable 100–900 in a single file. */
const onest = localFont({
  src: "./fonts/Onest-Variable.woff2",
  variable: "--ff-onest",
  weight: "100 900",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "sans-serif"],
});

/* EDITORIAL — upright Playfair Display. */
const playfair = localFont({
  src: "./fonts/PlayfairDisplay-Cyrillic-Variable.ttf",
  variable: "--ff-playfair",
  weight: "400 900",
  style: "normal",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

/* EDITORIAL ITALIC — Playfair Display Italic 400 retained for other editorial uses. */
const playfairItalic = localFont({
  src: "./fonts/PlayfairDisplay-Italic-Cyrillic.ttf",
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
  src: "./fonts/Droid-1997-Regular.woff2",
  variable: "--ff-droid-1997",
  weight: "400",
  style: "normal",
  display: "swap",
  fallback: ["Arial Narrow", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://statusteam.show"),
  title: "ПУЛЬС КОНТИНЕНТА — fashion show by STATUS TEAM",
  description:
    "Крупнейший показ нижнего белья в России. ПУЛЬС КОНТИНЕНТА — новое fashion-шоу STATUS TEAM в Москве. Предзаказ билетов, кастинг моделей, партнёрство и аккредитация СМИ.",
  openGraph: {
    title: "ПУЛЬС КОНТИНЕНТА — fashion show by STATUS TEAM",
    description:
      "Крупнейший показ нижнего белья в России. Москва. Предзаказ билетов уже открыт.",
    locale: "ru_RU",
    type: "website",
    images: ["/media/campaign-silhouette-sun-1600.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#100d0c",
  colorScheme: "dark",
  viewportFit: "cover",
};

const PRELOAD_ONCE = `try{if(sessionStorage.getItem('st-seen')){document.documentElement.classList.add('no-preload')}else{sessionStorage.setItem('st-seen','1')}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${tenor.variable} ${onest.variable} ${playfair.variable} ${playfairItalic.variable} ${cormorantGaramond.variable} ${droid1997.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: PRELOAD_ONCE }} />

        <div className="preloader" aria-hidden="true">
          <span className="curtain curtain-l" />
          <span className="curtain curtain-r" />
          <svg
            className="preloader-line"
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
            focusable="false"
          >
            <path d={PULSE_PATH} pathLength={1} />
          </svg>
        </div>

        <a className="skip-link" href="#statusteam">
          К содержанию
        </a>

        {children}
        <TenetStepLock />

        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
