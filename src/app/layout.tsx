import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import Preloader from "@/components/layout/Preloader";
import TenetStepLock from "@/motion/TenetStepLock";
import { MEDIA } from "@/content/media";
import "@/styles/index.css";

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
        <Preloader />
        <a className="skip-link" href="#statusteam">К содержанию</a>
        {children}
        <TenetStepLock />
      </body>
    </html>
  );
}
