import type { Metadata, Viewport } from "next";
import { Geist, Oswald, Prata } from "next/font/google";
import "./globals.css";

/* Utility / body — neutral, highly legible, strong Cyrillic. */
const geist = Geist({
  variable: "--ff-body",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

/* Structure / scale — condensed, used for chapter titles, numerals, labels. */
const oswald = Oswald({
  variable: "--ff-struct",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/* Campaign voice — the didone of the printed key art. Used sparingly, always large. */
const prata = Prata({
  variable: "--ff-campaign",
  subsets: ["latin", "cyrillic"],
  weight: "400",
  display: "swap",
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
    images: ["/media/campaign-silhouette-sun-1600.webp"],
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
      className={`${geist.variable} ${oswald.variable} ${prata.variable}`}
    >
      <body>
        <a className="skip-link" href="#manifest">
          К содержанию
        </a>
        {children}
      </body>
    </html>
  );
}
