import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import LegalFooter from "@/components/layout/LegalFooter";
import Preloader from "@/components/layout/Preloader";
import TenetStepLock from "@/motion/TenetStepLock";
import { MEDIA } from "@/content/media";
import "@/styles/index.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://statusteam.show"),
  title: "ПУЛЬС КОНТИНЕНТА — fashion show by STATUS TEAM",
  description:
    "Крупнейший показ нижнего белья в России. ПУЛЬС КОНТИНЕНТА — новое fashion-шоу STATUS TEAM в Москве. Билеты на показ, кастинг моделей, партнёрство и аккредитация СМИ.",
  openGraph: {
    title: "ПУЛЬС КОНТИНЕНТА — fashion show by STATUS TEAM",
    description:
      "Крупнейший показ нижнего белья в России. 30 ноября 2026, LOTTE HOTEL MOSCOW, Москва. Билеты на показ.",
    locale: "ru_RU",
    type: "website",
    images: [MEDIA.socialPreview],
  },
};

export const viewport: Viewport = {
  themeColor: "#100d0c",
  colorScheme: "dark",
  // Keep ordinary in-app browser content inside the host viewport.
  viewportFit: "auto",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={fontVariables}>
      <body>
        {/* Paint on the sticky box itself: fixed layers are clipped by iOS WebViews. */}
        <div className="browser-top-cover" aria-hidden="true" />
        <Preloader />
        <a className="skip-link" href="#statusteam">К содержанию</a>
        {children}
        <LegalFooter />
        <TenetStepLock />
      </body>
    </html>
  );
}
