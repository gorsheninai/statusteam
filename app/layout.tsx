import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
    "ПУЛЬС КОНТИНЕНТА — новый показ STATUS TEAM. Lingerie, аксессуары и визуальная культура. Кастинг моделей, партнёрство, билеты.",
  openGraph: {
    title: "ПУЛЬС КОНТИНЕНТА — fashion show by STATUS TEAM",
    description:
      "Новый показ STATUS TEAM. Кастинг моделей, партнёрство, билеты.",
    locale: "ru_RU",
    type: "website",
    /* The share card should be the hero the visitor is about to land on. */
    images: ["/media/header_16_9-1920.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#100d0c",
  colorScheme: "dark",
};

/* Plain, blocking, no `src` — the browser executes this the instant the
   parser reaches it, before it can paint anything. `next/script`'s
   beforeInteractive strategy looked like the idiomatic choice here, but it
   only guarantees "before hydration": measured against a fresh load, the
   class it set still landed ~140ms after the browser had already painted
   the hero fully visible, because it waits on Next's own runtime chunk to
   parse and run first. A raw script has no such dependency. */
const NO_FLASH_SCRIPT =
  "try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('pre-hero')}}catch(e){}";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${tenor.variable} ${onest.variable}`}
    >
      <head>
        {/* Sets a class that lets CSS pre-render the hero's entrance
            starting state (see .pre-hero in globals.css), so the browser's
            first painted frame already matches what Motion.tsx's GSAP
            timeline is about to animate from — no jump on hydration.
            Skipped under reduced motion; skipped entirely with JS off, so
            a no-JS visitor always gets the hero fully visible. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#manifest">
          К содержанию
        </a>
        {children}
      </body>
    </html>
  );
}
