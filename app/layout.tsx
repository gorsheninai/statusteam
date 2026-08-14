import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import IntroMotion from "@/components/IntroMotion";
import IntroFashionMount from "@/components/IntroFashionMount";
import "./globals.css";
import "./hero-v2.css";
import "./nav-v2.css";
import "./intro-tight.css";
import "./mobile-hero.css";
import "./intro-fashion.css";
import "./metrics-live.css";
import "./flow-trim.css";

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
    "Главное fashion-событие осени в мире нижнего белья от STATUS TEAM. Москва, ноябрь 2026.",
  openGraph: {
    title: "ПУЛЬС КОНТИНЕНТА — fashion show by STATUS TEAM",
    description:
      "Главное fashion-событие осени в мире нижнего белья. Москва, ноябрь 2026.",
    locale: "ru_RU",
    type: "website",
    images: ["/media/header_16_9.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#100d0c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${tenor.variable} ${onest.variable}`}
    >
      <body>
        <a className="skip-link" href="#manifest">
          К содержанию
        </a>
        <IntroMotion />
        <IntroFashionMount />
        {children}
      </body>
    </html>
  );
}
