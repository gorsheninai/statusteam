import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PULSE_PATH } from "@/lib/pulse-path";
import PolishMotion from "@/components/PolishMotion";
import "./globals.css";
import "./hero-placement.css";
import "./status-team.css";
import "./status-team-fixes.css";
import "./status-team-lockup.css";
import "./experience-program.css";
import "./status-team-final.css";
import "./card-stack.css";
import "./final-polish.css";
import "./mobile-fix.css";

/* Both faces are self-hosted: the production site must not depend on a font
   CDN. Each file is the upstream Google Fonts release (SIL OFL, licences
   alongside), subset to Latin + Cyrillic + the punctuation this page uses. */

/* DISPLAY — Tenor Sans. One weight only, by design; `font-synthesis: none`
   in globals.css stops the browser faking the bold this face does not have. */
const tenor = localFont({
  src: "./fonts/TenorSans-Regular.woff2",
  variable: "--ff-tenor",
  weight: "400",
  style: "normal",
  display: "swap",
  /* Fallback metrics matched to Tenor Sans, so the swap does not reflow. */
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

export const metadata: Metadata = {
  metadataBase: new URL("https://statusteam.show"),
  title: "ПУЛЬС КОНТИНЕНТА — fashion show by STATUS TEAM",
  description:
    "Крупнейший показ нижнего белья в России. ПУЛЬС КОНТИНЕНТА — новое fashion-шоу STATUS TEAM: 07 ноября 2026, Kinema, Москва. Билеты, кастинг моделей, партнёрство и аккредитация СМИ.",
  openGraph: {
    title: "ПУЛЬС КОНТИНЕНТА — fashion show by STATUS TEAM",
    description:
      "Крупнейший показ нижнего белья в России. 07 ноября 2026, Kinema, Москва.",
    locale: "ru_RU",
    type: "website",
    images: ["/media/campaign-silhouette-sun-1600.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#100d0c",
  colorScheme: "dark",
};

/**
 * Runs before the preloader element is parsed, so a repeat visit inside the
 * same tab never sees the curtain a second time — and never flashes it
 * either. Wrapped in try/catch because Safari's private mode throws on
 * sessionStorage access.
 */
const PRELOAD_ONCE = `try{if(sessionStorage.getItem('st-seen')){document.documentElement.classList.add('no-preload')}else{sessionStorage.setItem('st-seen','1')}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${tenor.variable} ${onest.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: PRELOAD_ONCE }} />

        {/* The stage curtain. Pure CSS on purpose: it covers the whole page,
            so it has to open even if the JavaScript bundle never arrives —
            otherwise it is a closed curtain with the site behind it. The
            pulse writes itself across the seam, then the wings part. */}
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

        <PolishMotion />
        {children}

        {/* Film grain over everything. Fixed, inert, and cheap: one tiling
            turbulence sprite moved by transform. */}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
